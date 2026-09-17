/**
 * ВЛАДЕЛЕЦ: зона A. Диагностика профиля: на что опереться, что мешает, куда идём.
 *
 * Никаких оценок личности и никаких прогнозов — только то, что прямо следует
 * из заполненной анкеты.
 */
import type { Diagnosis, Profile } from '@/types';
import {
  COUNTRY_LABELS_IN,
  COUNTRY_PREPOSITIONAL,
  ENGLISH_LABELS,
  ENGLISH_RANK,
  EXAM_LABELS,
  INTEREST_LABELS,
  formatGpa,
  formatKzt,
} from './labels';

function countriesPhrase(profile: Profile): string {
  const [first, second, ...rest] = profile.countries;

  if (!first) return '';
  if (!second) return COUNTRY_LABELS_IN[first];
  if (rest.length === 0) {
    return `${COUNTRY_LABELS_IN[first]} или ${COUNTRY_PREPOSITIONAL[second]}`;
  }
  // Предложный падеж множественного числа один на любое число: «в 3 странах».
  return `${COUNTRY_LABELS_IN[first]}, ${COUNTRY_PREPOSITIONAL[second]} и ещё ${rest.length} странах`;
}

export function diagnose(profile: Profile): Diagnosis {
  const strengths: string[] = [];
  const limits: string[] = [];

  const mainInterest = profile.interests[0];
  if (mainInterest) {
    strengths.push(`Направление выбрано — ${INTEREST_LABELS[mainInterest]}`);
  }

  if (profile.gpa >= 4.5) {
    strengths.push(`Высокий средний балл ${formatGpa(profile.gpa)} — проходит пороги сильных программ`);
  } else if (profile.gpa >= 4) {
    strengths.push(`Хороший средний балл ${formatGpa(profile.gpa)}`);
  } else if (profile.gpa < 3.5) {
    limits.push(`Средний балл ${formatGpa(profile.gpa)} ниже порога многих программ`);
  }

  if (ENGLISH_RANK[profile.languages.en] >= ENGLISH_RANK.b2) {
    strengths.push(`Английский ${ENGLISH_LABELS[profile.languages.en]} — открыты программы на английском`);
  } else if (ENGLISH_RANK[profile.languages.en] <= ENGLISH_RANK.basic) {
    limits.push('Английского пока нет — англоязычные программы недоступны');
  } else {
    limits.push('Английский на B1 — для большинства англоязычных программ нужен B2');
  }

  if (profile.languages.kz && profile.languages.ru) {
    strengths.push('Владеете казахским и русским — доступны программы на обоих языках');
  }

  const passed = profile.exams.filter((exam) => exam.score !== null);
  if (passed.length > 0) {
    const listed = passed.map((exam) => `${EXAM_LABELS[exam.id]} ${exam.score}`).join(', ');
    strengths.push(`Уже есть результаты: ${listed}`);
  }

  if (profile.exams.length === 0) {
    limits.push('Ни один экзамен не сдан и не запланирован');
  } else if (passed.length === 0) {
    limits.push('Экзамены запланированы, но результатов пока нет');
  }

  if (profile.grade === 10) {
    strengths.push('Вы в 10 классе — есть полный год на подготовку');
  } else {
    limits.push('Вы в 11 классе — времени на подготовку остаётся мало');
  }

  if (profile.countries.length > 1) {
    strengths.push(`Рассматриваете несколько стран (${profile.countries.length}) — выбор шире`);
  } else {
    limits.push('Рассматриваете только одну страну — список программ ограничен');
  }

  if (profile.budgetKztPerYear === 0) {
    limits.push('Бюджет только под грант — платные программы отпадают');
  } else if (profile.budgetKztPerYear < 1_500_000) {
    limits.push(`Ограниченный бюджет — ${formatKzt(profile.budgetKztPerYear)} в год`);
  }

  if (limits.length === 0) {
    limits.push('Главное ограничение — сроки: дедлайны нужно уточнять на сайтах программ');
  }

  const grantPart = profile.needsGrant ? ' на грант' : '';
  const goal = mainInterest
    ? `Поступить на направление «${INTEREST_LABELS[mainInterest]}» ${countriesPhrase(profile)}${grantPart}`
    : `Поступить ${countriesPhrase(profile)}${grantPart}`;

  return { strengths, limits, goal };
}
