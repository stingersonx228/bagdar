/**
 * ВЛАДЕЛЕЦ: зона C. «Рычаги шанса» — что конкретно поднимет шанс на программу.
 *
 * Контрфактическое объяснение: берём профиль, по одному меняем параметр,
 * который программа реально проверяет (балл экзамена, бюджет, средний балл,
 * английский), и прогоняем через тот же детерминированный движок. Если шанс
 * вырос — это рычаг. Никакой модели и никаких процентов: только «сделай X →
 * шанс станет таким-то», и каждая цифра взята из требований программы.
 */
import { ENGLISH_LABELS, EXAM_LABELS, formatGpa, formatKzt, recommend } from '@/engine';
import type { Level, Profile, Program, Recommendation } from '@/types';

export interface Lever {
  action: string;
  to: Level;
}

const RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };
const ENGLISH_ORDER: Profile['languages']['en'][] = ['none', 'basic', 'b1', 'b2', 'c1'];

interface Candidate {
  action: string;
  profile: Profile;
}

function candidatesFor(profile: Profile, program: Program): Candidate[] {
  const list: Candidate[] = [];

  for (const req of program.requirements) {
    if (req.minScore === null) continue;
    const own = profile.exams.find((exam) => exam.id === req.exam);
    const current = own?.score ?? null;
    const label = EXAM_LABELS[req.exam];
    // Порог программы и небольшой запас над ним: запас часто и отличает
    // «средний» шанс от «высокого».
    const targets = [req.minScore, Math.round(req.minScore * 1.1 * 10) / 10];
    for (const target of targets) {
      if (current !== null && current >= target) continue;
      const exams = own
        ? profile.exams.map((exam) => (exam.id === req.exam ? { ...exam, score: target } : exam))
        : [...profile.exams, { id: req.exam, score: target, plannedDate: null }];
      list.push({ action: `Набрать ${label} ${target}`, profile: { ...profile, exams } });
    }
  }

  if (program.tuitionKztPerYear !== null && profile.budgetKztPerYear < program.tuitionKztPerYear) {
    list.push({
      action: `Бюджет от ${formatKzt(program.tuitionKztPerYear)} в год`,
      profile: { ...profile, budgetKztPerYear: program.tuitionKztPerYear, needsGrant: false },
    });
  }

  if (program.minGpa !== null && profile.gpa < program.minGpa) {
    list.push({
      action: `Поднять средний балл до ${formatGpa(program.minGpa)}`,
      profile: { ...profile, gpa: program.minGpa },
    });
  }

  if (program.languageOfStudy === 'en') {
    const index = ENGLISH_ORDER.indexOf(profile.languages.en);
    for (const level of ENGLISH_ORDER.slice(index + 1)) {
      if (level === 'basic') continue;
      list.push({
        action: `Английский до уровня ${ENGLISH_LABELS[level]}`,
        profile: { ...profile, languages: { ...profile.languages, en: level } },
      });
    }
  }

  return list;
}

/** До двух самых сильных рычагов; порядок кандидатов = от меньшего усилия к большему. */
export function leversFor(profile: Profile, rec: Recommendation): Lever[] {
  if (rec.chance === 'high') return [];

  const found: Lever[] = [];
  for (const candidate of candidatesFor(profile, rec.program)) {
    const next = recommend(candidate.profile, [rec.program])[0];
    if (!next || RANK[next.chance] <= RANK[rec.chance]) continue;
    // Из двух целей для одного экзамена оставляем меньшую достаточную.
    const key = candidate.action.replace(/\s[\d.]+$/, '');
    if (found.some((lever) => lever.action.replace(/\s[\d.]+$/, '') === key)) continue;
    found.push({ action: candidate.action, to: next.chance });
  }

  return found.sort((a, b) => RANK[b.to] - RANK[a.to]).slice(0, 2);
}
