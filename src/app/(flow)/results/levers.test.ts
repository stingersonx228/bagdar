import { describe, expect, it } from 'vitest';
import { PROGRAMS } from '@/data';
import { SAMPLE_PROFILE } from '@/data/sampleProfile';
import { recommend } from '@/engine';
import type { Profile } from '@/types';
import { leversFor } from './levers';

const RANK = { low: 0, medium: 1, high: 2 } as const;

describe('рычаги шанса', () => {
  const profile: Profile = { ...SAMPLE_PROFILE, countries: ['KZ', 'KR', 'TR', 'CZ', 'HU', 'MY'], budgetKztPerYear: 0 };
  const recs = recommend(profile, PROGRAMS);

  it('у программы с высоким шансом рычагов нет', () => {
    for (const rec of recs.filter((item) => item.chance === 'high')) {
      expect(leversFor(profile, rec)).toEqual([]);
    }
  });

  it('каждый рычаг действительно поднимает шанс и их не больше двух', () => {
    const withLevers = recs.map((rec) => ({ rec, levers: leversFor(profile, rec) }));
    expect(withLevers.some((item) => item.levers.length > 0)).toBe(true);
    for (const { rec, levers } of withLevers) {
      expect(levers.length).toBeLessThanOrEqual(2);
      for (const lever of levers) expect(RANK[lever.to]).toBeGreaterThan(RANK[rec.chance]);
    }
  });

  it('детерминирован: одинаковый профиль — одинаковые рычаги', () => {
    for (const rec of recs) expect(leversFor(profile, rec)).toEqual(leversFor(profile, rec));
  });
});
