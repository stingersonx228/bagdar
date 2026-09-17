/**
 * ВЛАДЕЛЕЦ: зона C.
 * Сам вызов модели тестами не покроешь — нужна сеть и ключ. А вот границы
 * роута покрыть можно, и именно они защищают от двух вещей: мусора на входе
 * и от того, что модель протащит в ответ проценты или гарантию.
 */
import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseExplainRequest,
  validateSummary,
} from './contract';

const VALID = {
  programs: [
    {
      university: 'Astana IT University',
      program: 'Программная инженерия',
      chance: 'high',
      reasons: [
        { kind: 'match', text: 'Прямое попадание в ваше главное направление — IT' },
        { kind: 'warning', text: 'IELTS ещё не сдан' },
      ],
    },
  ],
};

describe('parseExplainRequest', () => {
  it('принимает корректное тело', () => {
    const parsed = parseExplainRequest(VALID);

    expect(parsed).not.toBeNull();
    expect(parsed!.programs).toHaveLength(1);
    expect(parsed!.programs[0].reasons).toHaveLength(2);
  });

  it('отбивает мусор вместо объекта', () => {
    for (const junk of [null, undefined, 'строка', 42, [], {}]) {
      expect(parseExplainRequest(junk)).toBeNull();
    }
  });

  it('отбивает пустой список программ', () => {
    expect(parseExplainRequest({ programs: [] })).toBeNull();
  });

  it('отбивает неизвестный уровень шанса', () => {
    const bad = { programs: [{ ...VALID.programs[0], chance: 'отличный' }] };
    expect(parseExplainRequest(bad)).toBeNull();
  });

  it('отбивает неизвестный вид причины', () => {
    const bad = {
      programs: [{ ...VALID.programs[0], reasons: [{ kind: 'похвала', text: 'текст' }] }],
    };
    expect(parseExplainRequest(bad)).toBeNull();
  });

  it('отбивает программу без причин', () => {
    const bad = { programs: [{ ...VALID.programs[0], reasons: [] }] };
    expect(parseExplainRequest(bad)).toBeNull();
  });

  it('обрезает список программ до потолка', () => {
    const many = { programs: Array.from({ length: 10 }, () => VALID.programs[0]) };
    expect(parseExplainRequest(many)!.programs).toHaveLength(LIMITS.programs);
  });

  it('обрезает длинный текст причины — роут не должен работать бесплатной LLM', () => {
    const long = {
      programs: [
        {
          ...VALID.programs[0],
          reasons: [{ kind: 'match', text: 'о'.repeat(5000) }],
        },
      ],
    };

    expect(parseExplainRequest(long)!.programs[0].reasons[0].text).toHaveLength(
      LIMITS.textLength,
    );
  });
});

describe('buildUserPrompt', () => {
  it('переносит в промпт и причины, и уровень шанса', () => {
    const prompt = buildUserPrompt(parseExplainRequest(VALID)!);

    expect(prompt).toContain('Astana IT University');
    expect(prompt).toContain('шанс: высокий');
    expect(prompt).toContain('IELTS ещё не сдан');
  });

  it('вид причины переводится, а не утекает кодом', () => {
    const prompt = buildUserPrompt(parseExplainRequest(VALID)!);

    expect(prompt).toContain('плюс');
    expect(prompt).toContain('оговорка');
    expect(prompt).not.toContain('match');
    expect(prompt).not.toContain('warning');
  });
});

describe('системный промпт', () => {
  it('прямо запрещает выдумывать и обещать', () => {
    expect(SYSTEM_PROMPT).toContain('не добавляй факты');
    expect(SYSTEM_PROMPT).toContain('не называй проценты');
  });
});

describe('validateSummary', () => {
  it('пропускает нормальный пересказ', () => {
    const text = 'Программа подходит вам по направлению и укладывается в бюджет. Осталось сдать IELTS.';
    expect(validateSummary(text)).toBe(text);
  });

  it('обрезает пробелы', () => {
    expect(validateSummary('  текст  ')).toBe('текст');
  });

  it('отклоняет пустой ответ', () => {
    expect(validateSummary('   ')).toBeNull();
  });

  it('отклоняет проценты — правило 3', () => {
    expect(validateSummary('Ваши шансы около 70 %.')).toBeNull();
    expect(validateSummary('Шанс поступления — семьдесят процентов.')).toBeNull();
  });

  it('отклоняет гарантии — правило 3', () => {
    expect(validateSummary('Это гарантирует поступление.')).toBeNull();
  });

  it('отклоняет слишком длинный ответ', () => {
    expect(validateSummary('а'.repeat(LIMITS.summaryLength + 1))).toBeNull();
  });
});
