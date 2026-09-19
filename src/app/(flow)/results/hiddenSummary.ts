/**
 * ВЛАДЕЛЕЦ: зона C. Прозрачность выдачи: сколько программ не показано и почему.
 *
 * Подборка без объяснения отсева выглядит как чёрный ящик. Здесь каждая
 * скрытая программа отнесена ровно к одной причине — первой, которая её
 * отсекла, — чтобы сумма по причинам совпадала с общим числом.
 */
import type { Profile, Program, Recommendation } from '@/types';

export type HiddenCause = 'country' | 'money' | 'exam' | 'language' | 'weak';

export const HIDDEN_LABELS: Record<HiddenCause, string> = {
  country: 'не та страна',
  money: 'дорого',
  exam: 'не хватает экзамена или баллов',
  language: 'язык обучения',
  weak: 'слабее совпадают',
};

const CAUSE_BY_CODE: Record<string, HiddenCause> = {
  over_budget: 'money',
  grant_required: 'money',
  exam_low: 'exam',
  gpa_low: 'exam',
  language_missing: 'language',
};

function causeOf(rec: Recommendation): HiddenCause {
  const blocker = rec.reasons.find((reason) => reason.kind === 'blocker');
  return (blocker && CAUSE_BY_CODE[blocker.code]) ?? 'weak';
}

export function hiddenSummary(
  profile: Profile,
  programs: Program[],
  recommendations: Recommendation[],
  visible: number,
): { total: number; parts: Array<{ cause: HiddenCause; count: number }> } {
  const counts = new Map<HiddenCause, number>();
  const bump = (cause: HiddenCause) => counts.set(cause, (counts.get(cause) ?? 0) + 1);

  const countries = new Set(profile.countries);
  programs.filter((program) => !countries.has(program.country)).forEach(() => bump('country'));
  recommendations.slice(visible).forEach((rec) => bump(causeOf(rec)));

  const order: HiddenCause[] = ['money', 'country', 'exam', 'language', 'weak'];
  const parts = order
    .filter((cause) => (counts.get(cause) ?? 0) > 0)
    .map((cause) => ({ cause, count: counts.get(cause) ?? 0 }));
  return { total: parts.reduce((sum, part) => sum + part.count, 0), parts };
}
