/**
 * ВЛАДЕЛЕЦ: зона C. Единственное место, где работает языковая модель.
 *
 * Правило 1 из CLAUDE.md: LLM не выбирает вузы и не придумывает требования.
 * Сюда приходит готовый разбор от движка, модель только пересказывает его
 * человеческим языком.
 *
 * Правило 5: ключи читаются на сервере и в браузер не попадают.
 * Провайдер: GEMINI_API_KEY (бесплатный тариф) → иначе ANTHROPIC_API_KEY → иначе фолбэк.
 *
 * Роут никогда не отвечает ошибкой наружу так, чтобы экран сломался: без
 * ключа, при сбое API или на подозрительном ответе он возвращает
 * { ok: false }, а интерфейс просто оставляет исходные причины движка.
 */
import Anthropic from '@anthropic-ai/sdk';
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

/** Потолок ожидания модели: дольше пользователь ждать не должен, будет фолбэк. */
const TIMEOUT_MS = 8_000;

/**
 * Gemini — основной провайдер: у Google AI Studio есть бесплатный тариф, для
 * хакатона это важно. Вызов через обычный fetch, без лишней зависимости.
 */
async function askGemini(apiKey: string, userPrompt: string): Promise<string | null> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.2 },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();
  return text.length > 0 ? text : null;
}

/** Запасной провайдер: Claude Haiku — быстрый и дешёвый для пересказа. */
async function askClaude(apiKey: string, userPrompt: string): Promise<string | null> {
  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    // Ответ — два-три предложения, большой потолок здесь не нужен.
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
  if (message.stop_reason === 'refusal') return null;
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

export async function POST(request: Request) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!geminiKey && !claudeKey) return unavailable('no-key');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable('bad-request', 400);
  }

  const parsed = parseExplainRequest(body);
  if (!parsed) return unavailable('bad-request', 400);

  const userPrompt = buildUserPrompt(parsed);

  try {
    const text = geminiKey
      ? await askGemini(geminiKey, userPrompt)
      : await askClaude(claudeKey ?? '', userPrompt);
    if (text === null) return unavailable('rejected');

    const summary = validateSummary(text);
    if (summary === null) return unavailable('rejected');

    return NextResponse.json<ExplainResponse>({ ok: true, summary });
  } catch (error) {
    // Наружу текст ошибки не отдаём: в нём может быть служебная информация.
    console.error('[explain] вызов модели не удался', error);
    return unavailable('api-error');
  }
}
