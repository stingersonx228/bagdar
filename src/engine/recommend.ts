/**
 * ВЛАДЕЛЕЦ: зона A. Подбор программ под профиль.
 *
 * Чистая функция: без сети, случайности и чтения текущего времени. Один и тот
 * же профиль всегда даёт один и тот же список в одном и том же порядке.
 */
import type { Level, Profile, Program, Reason, Recommendation } from '@/types';
import {
  academicBucket,
  interestBucket,
  languageBucket,
  moneyBucket,
  prioritiesBucket,
} from './scoring';

/** Блокеры показываем первыми: это то, что реально мешает поступить. */
const REASON_ORDER: Record<Reason['kind'], number> = {
  blocker: 0,
  warning: 1,
  match: 2,
};

function sortReasons(reasons: Reason[]): Reason[] {
  return [...reasons].sort((a, b) => {
    const byKind = REASON_ORDER[a.kind] - REASON_ORDER[b.kind];
    if (byKind !== 0) return byKind;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
  });
}

/**
 * Уровень шанса. Процентов нет и не будет: любой процент здесь был бы
 * выдумкой, а обещать абитуриенту вероятность поступления нечестно.
 */
function chanceOf(score: number, reasons: Reason[]): Level {
  if (reasons.some((item) => item.kind === 'blocker')) return 'low';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function recommend(profile: Profile, programs: Program[]): Recommendation[] {
  const countries = new Set(profile.countries);

  return programs
    .filter((program) => countries.has(program.country))
    .map((program) => {
      const buckets = [
        interestBucket(profile, program),
        moneyBucket(profile, program),
        academicBucket(profile, program),
        languageBucket(profile, program),
        prioritiesBucket(profile, program),
      ];

      const points = buckets.reduce((sum, bucket) => sum + bucket.points, 0);
      const reasons = buckets.flatMap((bucket) => bucket.reasons);
      const score = Math.round(points);

      return {
        program,
        score,
        chance: chanceOf(score, reasons),
        reasons: sortReasons(reasons),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Тай-брейк по id, иначе порядок зависел бы от порядка в JSON.
      return a.program.id < b.program.id ? -1 : a.program.id > b.program.id ? 1 : 0;
    });
}
