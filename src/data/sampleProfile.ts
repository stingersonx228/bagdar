/**
 * ВЛАДЕЛЕЦ: зона A. Пример профиля для кнопки «заполнить примером».
 *
 * Нужен для демонстрации: у жюри нет двух минут на заполнение анкеты руками.
 * Профиль намеренно «средний по больнице» — не отличник и не безнадёжный,
 * чтобы в выдаче встречались и высокие шансы, и предупреждения.
 *
 * Страна одна: так нагляднее, когда её добавляют и список меняется на глазах.
 */
import type { Profile } from '@/types';

export const SAMPLE_PROFILE: Profile = {
  grade: 11,
  interests: ['it', 'engineering'],
  gpa: 4.4,
  languages: { kz: true, ru: true, en: 'b2' },
  exams: [
    { id: 'ENT', score: 118, plannedDate: null },
    { id: 'IELTS', score: null, plannedDate: '2027-02-15' },
  ],
  countries: ['KZ'],
  preferredCities: ['Алматы'],
  budgetKztPerYear: 2_500_000,
  needsGrant: true,
  priorities: ['cost', 'career'],
};
