/** ВЛАДЕЛЕЦ: зона A. Общие заготовки для тестов движка. */
import type { Profile, Program } from '@/types';

/**
 * Профиль-основа: сильный, но не идеальный абитуриент. Тесты меняют по одному
 * полю и смотрят, что движок реагирует.
 */
export const BASE_PROFILE: Profile = {
  grade: 11,
  interests: ['it', 'engineering'],
  gpa: 4.5,
  languages: { kz: true, ru: true, en: 'b2' },
  exams: [
    { id: 'ENT', score: 115, plannedDate: null },
    { id: 'IELTS', score: 6.5, plannedDate: null },
  ],
  countries: ['KZ'],
  preferredCities: [],
  budgetKztPerYear: 2_500_000,
  needsGrant: true,
  priorities: ['cost', 'career'],
};

export function profileOf(patch: Partial<Profile> = {}): Profile {
  return { ...BASE_PROFILE, ...patch };
}

export const TODAY = new Date('2026-09-16T00:00:00.000Z');

/** Программа с известным дедлайном — в реальных данных таких пока нет. */
export function programWithDeadline(date: string | null): Program {
  return {
    id: 'test-program',
    university: 'Тестовый университет',
    program: 'Тестовая программа',
    country: 'KZ',
    city: 'Алматы',
    interests: ['it'],
    languageOfStudy: 'ru',
    tuitionKztPerYear: 1_000_000,
    tuitionNote: null,
    grantAvailable: true,
    requirements: [{ exam: 'ENT', minScore: 90 }],
    minGpa: 4,
    deadlines: [
      {
        id: 'test-program:application',
        label: 'Подача документов',
        date,
        sourceUrl: date === null ? null : 'https://example.kz/admission',
      },
    ],
    prestige: 'medium',
    career: 'medium',
    sourceUrl: 'https://example.kz/',
    checkedAt: '2026-09-16',
    unverified: [],
  };
}
