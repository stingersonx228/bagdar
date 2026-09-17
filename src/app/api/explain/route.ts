/**
 * ВЛАДЕЛЕЦ: зона C. Единственное место, где работает языковая модель.
 *
 * Правило 1 из CLAUDE.md: LLM не выбирает вузы и не придумывает требования.
 * Сюда приходит готовый разбор от движка, модель только пересказывает его
 * человеческим языком.
 *
 * Правило 5: ключ читается на сервере и в браузер не попадает.
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

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return unavailable('no-key');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable('bad-request', 400);
  }

  const parsed = parseExplainRequest(body);
  if (!parsed) return unavailable('bad-request', 400);

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-opus-5',
      // Ответ — два-три предложения, большой потолок здесь не нужен.
      max_tokens: 500,
      // Пересказ готового текста не требует глубокого рассуждения.
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(parsed) }],
    });

    if (message.stop_reason === 'refusal') return unavailable('rejected');

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const summary = validateSummary(text);
    if (summary === null) return unavailable('rejected');

    return NextResponse.json<ExplainResponse>({ ok: true, summary });
  } catch (error) {
    // Наружу текст ошибки не отдаём: в нём может быть служебная информация.
    console.error('[explain] вызов модели не удался', error);
    return unavailable('api-error');
  }
}
