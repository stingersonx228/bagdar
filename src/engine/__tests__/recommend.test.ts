/**
 * ВЛАДЕЛЕЦ: зона A.
 * Главная проверка кейса: жюри меняет бюджет, страну, интерес или экзамен —
 * и результат обязан заметно измениться. Каждый такой сценарий закреплён тестом.
 */
import { describe, expect, it } from 'vitest';
import { recommend } from '@/engine';
import { PROGRAMS } from '@/data';
import { BASE_PROFILE, profileOf } from './fixtures';

const ids = (profile = BASE_PROFILE) => recommend(profile, PROGRAMS).map((rec) => rec.program.id);

describe('recommend — базовое поведение', () => {
  it('выдаёт минимум 3 программы для заполненного профиля', () => {
    expect(recommend(BASE_PROFILE, PROGRAMS).length).toBeGreaterThanOrEqual(3);
  });

  it('оставляет только выбранные страны', () => {
    const recs = recommend(profileOf({ countries: ['KZ'] }), PROGRAMS);
    expect(recs.every((rec) => rec.program.country === 'KZ')).toBe(true);
  });

  it('детерминирован: одинаковый профиль даёт одинаковый результат', () => {
    expect(recommend(BASE_PROFILE, PROGRAMS)).toEqual(recommend(BASE_PROFILE, PROGRAMS));
  });

  it('сортирует по убыванию score', () => {
    const scores = recommend(BASE_PROFILE, PROGRAMS).map((rec) => rec.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('никогда не отдаёт проценты — только уровни', () => {
    for (const rec of recommend(BASE_PROFILE, PROGRAMS)) {
      expect(['high', 'medium', 'low']).toContain(rec.chance);
    }
  });

  it('у каждой рекомендации есть хотя бы одна причина', () => {
    for (const rec of recommend(BASE_PROFILE, PROGRAMS)) {
      expect(rec.reasons.length).toBeGreaterThan(0);
    }
  });

  it('на пустом каталоге возвращает пустой список, а не падает', () => {
    expect(recommend(BASE_PROFILE, [])).toEqual([]);
  });
});

describe('жюри меняет страну', () => {
  it('другая страна — полностью другой список', () => {
    const kz = ids(profileOf({ countries: ['KZ'] }));
    const kr = ids(profileOf({ countries: ['KR'] }));

    expect(kr.length).toBeGreaterThan(0);
    expect(kz.some((id) => kr.includes(id))).toBe(false);
  });

  it('добавление второй страны расширяет список', () => {
    const one = ids(profileOf({ countries: ['KZ'] }));
    const two = ids(profileOf({ countries: ['KZ', 'CZ'] }));

    expect(two.length).toBeGreaterThan(one.length);
  });
});

describe('жюри меняет интерес', () => {
  it('медицина поднимает медицинскую программу на первое место', () => {
    const [top] = recommend(profileOf({ interests: ['medicine'] }), PROGRAMS);
    expect(top.program.interests).toContain('medicine');
  });

  it('IT и медицина дают разные вершины списка', () => {
    const it = ids(profileOf({ interests: ['it'] }))[0];
    const medicine = ids(profileOf({ interests: ['medicine'] }))[0];

    expect(it).not.toBe(medicine);
  });

  it('порядок интересов влияет на оценку', () => {
    const first = recommend(profileOf({ interests: ['it', 'business'] }), PROGRAMS);
    const second = recommend(profileOf({ interests: ['business', 'it'] }), PROGRAMS);

    const itProgram = (recs: typeof first) => recs.find((rec) => rec.program.id === 'astanait-se');
    expect(itProgram(first)!.score).toBeGreaterThan(itProgram(second)!.score);
  });
});

describe('жюри меняет бюджет', () => {
  it('нулевой бюджет блокирует программы без гранта', () => {
    const recs = recommend(profileOf({ countries: ['MY'], budgetKztPerYear: 0 }), PROGRAMS);
    const withoutGrant = recs.filter((rec) => !rec.program.grantAvailable);

    expect(withoutGrant.length).toBeGreaterThan(0);
    for (const rec of withoutGrant) {
      expect(rec.chance).toBe('low');
      expect(rec.reasons.some((item) => item.code === 'grant_required')).toBe(true);
    }
  });

  it('рост бюджета поднимает оценку дорогой программы', () => {
    const findKimep = (budget: number) =>
      recommend(profileOf({ budgetKztPerYear: budget }), PROGRAMS).find(
        (rec) => rec.program.id === 'kimep-ba',
      )!;

    const poor = findKimep(1_000_000);
    const rich = findKimep(5_000_000);

    expect(rich.score).toBeGreaterThan(poor.score);
    expect(rich.reasons.some((item) => item.code === 'fits_budget')).toBe(true);
    expect(poor.reasons.some((item) => item.code === 'over_budget_grant')).toBe(true);
  });

  it('программа дороже бюджета и без гранта получает блокер', () => {
    const rec = recommend(
      profileOf({ countries: ['KR'], budgetKztPerYear: 1_000_000 }),
      PROGRAMS,
    ).find((item) => item.program.id === 'korea-cs')!;

    expect(rec.reasons.some((item) => item.kind === 'blocker' && item.code === 'over_budget')).toBe(true);
    expect(rec.chance).toBe('low');
  });
});

describe('жюри меняет экзамены', () => {
  it('несданный экзамен даёт предупреждение и снижает оценку', () => {
    const withExam = recommend(BASE_PROFILE, PROGRAMS).find((rec) => rec.program.id === 'kimep-ba')!;
    const withoutExam = recommend(profileOf({ exams: [] }), PROGRAMS).find(
      (rec) => rec.program.id === 'kimep-ba',
    )!;

    expect(withExam.score).toBeGreaterThan(withoutExam.score);
    expect(withoutExam.reasons.some((item) => item.code === 'exam_missing')).toBe(true);
  });

  it('балл ниже требуемого — это блокер, а не предупреждение', () => {
    const rec = recommend(
      profileOf({ exams: [{ id: 'ENT', score: 50, plannedDate: null }] }),
      PROGRAMS,
    ).find((item) => item.program.id === 'kaznmu-med')!;

    expect(rec.reasons.some((item) => item.kind === 'blocker' && item.code === 'exam_low')).toBe(true);
    expect(rec.chance).toBe('low');
  });

  it('запланированный экзамен засчитывается частично', () => {
    const rec = recommend(
      profileOf({ exams: [{ id: 'ENT', score: null, plannedDate: '2026-06-01' }] }),
      PROGRAMS,
    ).find((item) => item.program.id === 'astanait-se')!;

    expect(rec.reasons.some((item) => item.code === 'exam_planned')).toBe(true);
  });
});

describe('язык обучения', () => {
  it('без английского англоязычные программы блокируются', () => {
    const recs = recommend(
      profileOf({ languages: { kz: true, ru: true, en: 'none' } }),
      PROGRAMS,
    ).filter((rec) => rec.program.languageOfStudy === 'en');

    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.chance).toBe('low');
      expect(rec.reasons.some((item) => item.code === 'language_missing')).toBe(true);
    }
  });

  it('без казахского казахоязычная программа блокируется', () => {
    const rec = recommend(
      profileOf({ interests: ['law'], languages: { kz: false, ru: true, en: 'b2' } }),
      PROGRAMS,
    ).find((item) => item.program.id === 'kaznu-law')!;

    expect(rec.reasons.some((item) => item.code === 'language_missing')).toBe(true);
  });
});

describe('порядок причин', () => {
  it('блокеры идут первыми', () => {
    const rec = recommend(
      profileOf({ languages: { kz: true, ru: true, en: 'none' } }),
      PROGRAMS,
    ).find((item) => item.reasons.some((r) => r.kind === 'blocker'))!;

    expect(rec.reasons[0].kind).toBe('blocker');
  });
});
