/**
 * ВЛАДЕЛЕЦ: зона A. Человеческие подписи для значений контракта.
 *
 * Живут в движке, потому что движок сам собирает текст причин и диагностики.
 * Зоны B и C импортируют их отсюда же, чтобы подписи не разъехались между
 * карточкой программы и объяснением движка.
 */
import type { Country, ExamId, Interest, Profile, Program } from '@/types';

export const INTEREST_LABELS: Record<Interest, string> = {
  it: 'IT',
  engineering: 'Инженерия',
  business: 'Бизнес',
  medicine: 'Медицина',
  design: 'Дизайн',
  science: 'Наука',
  humanities: 'Гуманитарные науки',
  law: 'Право',
};

export const COUNTRY_LABELS: Record<Country, string> = {
  KZ: 'Казахстан',
  KR: 'Южная Корея',
  TR: 'Турция',
  CZ: 'Чехия',
  HU: 'Венгрия',
  MY: 'Малайзия',
};

/** Предложный падеж: нужен, чтобы «в Венгрии или Чехии» не превращалось в «или Чехия». */
export const COUNTRY_PREPOSITIONAL: Record<Country, string> = {
  KZ: 'Казахстане',
  KR: 'Южной Корее',
  TR: 'Турции',
  CZ: 'Чехии',
  HU: 'Венгрии',
  MY: 'Малайзии',
};

export const COUNTRY_LABELS_IN: Record<Country, string> = {
  KZ: `в ${COUNTRY_PREPOSITIONAL.KZ}`,
  KR: `в ${COUNTRY_PREPOSITIONAL.KR}`,
  TR: `в ${COUNTRY_PREPOSITIONAL.TR}`,
  CZ: `в ${COUNTRY_PREPOSITIONAL.CZ}`,
  HU: `в ${COUNTRY_PREPOSITIONAL.HU}`,
  MY: `в ${COUNTRY_PREPOSITIONAL.MY}`,
};

export const EXAM_LABELS: Record<ExamId, string> = {
  ENT: 'ЕНТ',
  IELTS: 'IELTS',
  TOEFL: 'TOEFL',
  SAT: 'SAT',
  NUET: 'NUET',
  TOPIK: 'TOPIK',
  YOS: 'YÖS',
};

export const STUDY_LANGUAGE_LABELS: Record<Program['languageOfStudy'], string> = {
  kz: 'казахском',
  ru: 'русском',
  en: 'английском',
  local: 'местном языке',
};

export const ENGLISH_LABELS: Record<Profile['languages']['en'], string> = {
  none: 'нет',
  basic: 'базовый',
  b1: 'B1',
  b2: 'B2',
  c1: 'C1',
};

/** Порядок уровней английского — нужен для сравнения «не ниже B2». */
export const ENGLISH_RANK: Record<Profile['languages']['en'], number> = {
  none: 0,
  basic: 1,
  b1: 2,
  b2: 3,
  c1: 4,
};

/** Разделители разрядов ставим руками: Intl зависит от сборки ICU и ломает тесты. */
export function formatKzt(value: number): string {
  const digits = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${digits} ₸`;
}

/** 4 вместо 4.0, 4.3 вместо 4.30 — балл в тексте читается как в аттестате. */
export function formatGpa(value: number): string {
  return Number(value.toFixed(2)).toString();
}
