/**
 * ВЛАДЕЛЕЦ: зона C. Единственное место, где работает языковая модель.
 *
 * Правило 1 из CLAUDE.md: LLM не выбирает вузы и не придумывает требования.
 * Сюда приходит готовый разбор от движка, модель только пересказывает его
 * человеческим языком.
 *
 * Правило 5: ключи читаются на сервере и в браузер не попадают.
 * Провайдеры по очереди, все с бесплатным тарифом: Gemini → Groq → OpenRouter → фолбэк.
 *
 * Роут никогда не отвечает ошибкой наружу так, чтобы экран сломался: без
 * ключа, при сбое API или на подозрительном ответе он возвращает
 * { ok: false }, а интерфейс просто оставляет исходные причины движка.
 */
import { NextResponse } from 'next/server';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseExplainRequest,
  validateSummary,
} from './contract';

export interface ExplainResponse {
  ok: boolean;
  summary: string | null;
  /** Почему объяснения нет — для отладки, интерфейс это не показывает. */
  reason?: 'no-key' | 'bad-request' | 'api-error' | 'rejected';
}

function unavailable(reason: ExplainResponse['reason'], status = 200) {
  return NextResponse.json<ExplainResponse>({ ok: false, summary: null, reason }, { status });
}

/** Общий потолок ожидания на всю цепочку: дольше пользователь ждать не должен. */
const TIMEOUT_MS = 8_000;

type Ask = (userPrompt: string, signal: AbortSignal) => Promise<string | null>;

interface Provider {
  name: string;
  ask: Ask;
}

/** Google Gemini: бесплатный тариф в AI Studio, основной провайдер. */
function gemini(apiKey: string): Provider {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return {
    name: 'gemini',
    ask: async (userPrompt, signal) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { maxOutputTokens: 500, temperature: 0.2 },
          }),
        },
      );
      if (!response.ok) throw new Error(`gemini HTTP ${response.status}`);
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('\n')
        .trim();
      return text.length > 0 ? text : null;
    },
  };
}

/**
 * Groq и OpenRouter говорят на OpenAI-совместимом протоколе, поэтому у них
 * один клиент. У обоих есть бесплатный доступ: у Groq — лимиты в минуту,
 * у OpenRouter — модели с суффиксом :free.
 */
function openAiCompatible(name: string, url: string, apiKey: string, model: string): Provider {
  return {
    name,
    ask: async (userPrompt, signal) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        signal,
        body: JSON.stringify({
          model,
          max_tokens: 500,
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!response.ok) throw new Error(`${name} HTTP ${response.status}`);
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? '';
      return text.length > 0 ? text : null;
    },
  };
}

/** Очередь провайдеров — только бесплатные тарифы, в порядке качества пересказа. */
function configuredProviders(): Provider[] {
  const env = process.env;
  const list: Provider[] = [];
  if (env.GEMINI_API_KEY) list.push(gemini(env.GEMINI_API_KEY));
  if (env.GROQ_API_KEY) {
    list.push(
      openAiCompatible(
        'groq',
        'https://api.groq.com/openai/v1/chat/completions',
        env.GROQ_API_KEY,
        env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      ),
    );
  }
  if (env.OPENROUTER_API_KEY) {
    list.push(
      openAiCompatible(
        'openrouter',
        'https://openrouter.ai/api/v1/chat/completions',
        env.OPENROUTER_API_KEY,
        env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      ),
    );
  }
  return list;
}

export async function POST(request: Request) {
  const providers = configuredProviders();
  if (providers.length === 0) return unavailable('no-key');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable('bad-request', 400);
  }

  const parsed = parseExplainRequest(body);
  if (!parsed) return unavailable('bad-request', 400);

  const userPrompt = buildUserPrompt(parsed);
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let rejected = false;

  // Упал провайдер или упёрся в бесплатный лимит — пробуем следующего.
  for (const provider of providers) {
    if (signal.aborted) break;
    try {
      const text = await provider.ask(userPrompt, signal);
      const summary = text === null ? null : validateSummary(text);
      if (summary !== null) return NextResponse.json<ExplainResponse>({ ok: true, summary });
      rejected = true;
    } catch (error) {
      // Наружу текст ошибки не отдаём: в нём может быть служебная информация.
      console.error(`[explain] ${provider.name} не ответил`, error);
    }
  }

  return unavailable(rejected ? 'rejected' : 'api-error');
}
