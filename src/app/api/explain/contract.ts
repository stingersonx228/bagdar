/**
 * ВЛАДЕЛЕЦ: зона C. Чистая часть AI-объяснения: разбор запроса, сборка
 * промпта и проверка ответа модели.
 *
 * Вынесено из route.ts, чтобы это можно было покрыть тестами без сети и
 * без ключа: сам вызов API в тестах не проверить, а вот границы — можно.
 */
import type { Level } from '@/types';

/** Жёсткие потолки. Роут публичный, и без них его можно использовать как бесплатную LLM. */
export const LIMITS = {
  programs: 3,
  reasonsPerProgram: 6,
  textLength: 200,
  summaryLength: 600,
} as const;

export interface ExplainReason {
  kind: 'match' | 'warning' | 'blocker';
  text: string;
}

export interface ExplainProgram {
  university: string;
  program: string;
  chance: Level;
  reasons: ExplainReason[];
}

export interface ExplainRequest {
  programs: ExplainProgram[];
}

const KINDS = new Set(['match', 'warning', 'blocker']);
const LEVELS = new Set(['high', 'medium', 'low']);

function trimText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0) return null;
  return text.slice(0, LIMITS.textLength);
}

/**
 * Разбор тела запроса. Возвращает null на любом мусоре: роут отвечает 400,
 * а не пытается угадать, что имел в виду вызывающий.
 */
export function parseExplainRequest(body: unknown): ExplainRequest | null {
  if (typeof body !== 'object' || body === null) return null;

  const raw = (body as { programs?: unknown }).programs;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const programs: ExplainProgram[] = [];

  for (const item of raw.slice(0, LIMITS.programs)) {
    if (typeof item !== 'object' || item === null) return null;
    const candidate = item as Record<string, unknown>;

    const university = trimText(candidate.university);
    const program = trimText(candidate.program);
    const chance = candidate.chance;

    if (university === null || program === null) return null;
    if (typeof chance !== 'string' || !LEVELS.has(chance)) return null;
    if (!Array.isArray(candidate.reasons)) return null;

    const reasons: ExplainReason[] = [];
    for (const entry of candidate.reasons.slice(0, LIMITS.reasonsPerProgram)) {
      if (typeof entry !== 'object' || entry === null) return null;
      const reason = entry as Record<string, unknown>;
      const text = trimText(reason.text);
      if (text === null) return null;
      if (typeof reason.kind !== 'string' || !KINDS.has(reason.kind)) return null;
      reasons.push({ kind: reason.kind as ExplainReason['kind'], text });
    }

    if (reasons.length === 0) return null;
    programs.push({ university, program, chance: chance as Level, reasons });
  }

  return { programs };
}

const KIND_LABEL: Record<ExplainReason['kind'], string> = {
  match: 'плюс',
  warning: 'оговорка',
  blocker: 'препятствие',
};

const CHANCE_LABEL: Record<Level, string> = {
  high: 'высокий',
  medium: 'средний',
  low: 'низкий',
};

/**
 * Правило 1: модель ничего не выбирает и не добавляет. Она получает готовый
 * разбор от движка и только пересказывает его человеческим языком.
 */
export const SYSTEM_PROMPT = [
  'Ты помогаешь школьнику из Казахстана понять, почему программа подобрана именно ему.',
  'Тебе дают готовый разбор: движок уже выбрал программы и перечислил причины.',
  '',
  'Строгие запреты:',
  '— не добавляй факты, которых нет во входных данных: ни вузов, ни цифр, ни дат, ни требований;',
  '— не называй проценты и вероятности поступления и ничего не гарантируй;',
  '— не давай советов, которых нет в причинах;',
  '— не меняй смысл: препятствие остаётся препятствием.',
  '',
  'Формат ответа: 2–3 предложения связного текста на русском, без списков и заголовков.',
  'Обращайся на «вы». Пиши спокойно и по делу, без восторгов.',
].join('\n');

export function buildUserPrompt(request: ExplainRequest): string {
  const blocks = request.programs.map((program, index) => {
    const reasons = program.reasons
      .map((reason) => `  - ${KIND_LABEL[reason.kind]}: ${reason.text}`)
      .join('\n');

    return [
      `${index + 1}. ${program.program} — ${program.university}`,
      `  шанс: ${CHANCE_LABEL[program.chance]}`,
      reasons,
    ].join('\n');
  });

  return [
    'Разбор от движка:',
    '',
    ...blocks,
    '',
    'Перескажи это одним связным объяснением.',
  ].join('\n');
}

/**
 * Проверка ответа модели. Пустой, слишком длинный текст или проценты с
 * гарантиями — повод откатиться на исходные причины, а не показывать это
 * пользователю: правило 3 запрещает проценты и обещания.
 */
export function validateSummary(text: string): string | null {
  const summary = text.trim();

  if (summary.length === 0) return null;
  if (summary.length > LIMITS.summaryLength) return null;
  if (/\d\s*%|процент/i.test(summary)) return null;
  if (/гаранти/i.test(summary)) return null;

  return summary;
}
