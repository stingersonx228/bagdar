/** ВЛАДЕЛЕЦ: зона A. Диагностика должна меняться вместе с профилем. */
import { describe, expect, it } from 'vitest';
import { diagnose } from '@/engine';
import { BASE_PROFILE, profileOf } from './fixtures';

describe('diagnose', () => {
  it('всегда даёт непустые сильные стороны и ограничения', () => {
    const result = diagnose(BASE_PROFILE);

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.limits.length).toBeGreaterThan(0);
    expect(result.goal.length).toBeGreaterThan(0);
  });

  it('детерминирован', () => {
    expect(diagnose(BASE_PROFILE)).toEqual(diagnose(BASE_PROFILE));
  });

  it('10 класс — это сильная сторона, 11 класс — ограничение', () => {
    const tenth = diagnose(profileOf({ grade: 10 }));
    const eleventh = diagnose(profileOf({ grade: 11 }));

    expect(tenth.strengths.some((item) => item.includes('10 классе'))).toBe(true);
    expect(eleventh.limits.some((item) => item.includes('11 классе'))).toBe(true);
  });

  it('нулевой бюджет попадает в ограничения', () => {
    const result = diagnose(profileOf({ budgetKztPerYear: 0 }));
    expect(result.limits.some((item) => item.includes('грант'))).toBe(true);
  });

  it('высокий балл — сильная сторона, низкий — ограничение', () => {
    expect(diagnose(profileOf({ gpa: 4.8 })).strengths.some((item) => item.includes('4.8'))).toBe(true);
    expect(diagnose(profileOf({ gpa: 3 })).limits.some((item) => item.includes('3'))).toBe(true);
  });

  it('отсутствие английского попадает в ограничения', () => {
    const result = diagnose(profileOf({ languages: { kz: true, ru: true, en: 'none' } }));
    expect(result.limits.some((item) => item.includes('Английского'))).toBe(true);
  });

  it('цель содержит направление и страну', () => {
    const result = diagnose(profileOf({ interests: ['medicine'], countries: ['KZ'] }));

    expect(result.goal).toContain('Медицина');
    expect(result.goal).toContain('Казахстане');
  });

  it('вторая страна в цели стоит в предложном падеже', () => {
    const goal = diagnose(profileOf({ countries: ['HU', 'CZ'] })).goal;

    expect(goal).toContain('в Венгрии или Чехии');
    expect(goal).not.toContain('Чехия');
  });

  it('три и больше стран сворачиваются без ошибок в числе', () => {
    const goal = diagnose(profileOf({ countries: ['KZ', 'TR', 'MY', 'CZ'] })).goal;

    expect(goal).toContain('и ещё 2 странах');
    expect(goal).not.toContain('стране');
  });

  it('цель упоминает грант, только если он нужен', () => {
    expect(diagnose(profileOf({ needsGrant: true })).goal).toContain('грант');
    expect(diagnose(profileOf({ needsGrant: false })).goal).not.toContain('грант');
  });

  it('несколько стран — сильная сторона, одна — ограничение', () => {
    expect(
      diagnose(profileOf({ countries: ['KZ', 'TR'] })).strengths.some((item) =>
        item.includes('несколько стран'),
      ),
    ).toBe(true);
    expect(
      diagnose(profileOf({ countries: ['KZ'] })).limits.some((item) => item.includes('одну страну')),
    ).toBe(true);
  });
});
