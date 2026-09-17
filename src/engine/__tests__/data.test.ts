/**
 * ВЛАДЕЛЕЦ: зона A.
 * Каталог программ приходит из JSON, а JSON типами не проверяется. Этот тест —
 * единственная защита от опечатки в стране, интересе или экзамене, и он же
 * держит правило 2: поле без источника перечислено в unverified.
 */
import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_CITIES,
  PROGRAMS,
  citiesOfCountry,
  hasUnverifiedFacts,
  isUnverified,
  normalizeCity,
  programById,
} from '@/data';
import type { Country, ExamId, Interest, Level, VerifiableField } from '@/types';

const COUNTRIES: Country[] = ['KZ', 'KR', 'TR', 'CZ', 'HU', 'MY'];
const INTERESTS: Interest[] = [
  'it',
  'engineering',
  'business',
  'medicine',
  'design',
  'science',
  'humanities',
  'law',
];
const EXAMS: ExamId[] = ['ENT', 'IELTS', 'TOEFL', 'SAT', 'NUET', 'TOPIK', 'YOS'];
const STUDY_LANGUAGES = ['kz', 'ru', 'en', 'local'];
const LEVELS: Level[] = ['high', 'medium', 'low'];
const VERIFIABLE_FIELDS: VerifiableField[] = [
  'tuitionKztPerYear',
  'grantAvailable',
  'requirements',
  'minGpa',
  'deadlines',
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('каталог программ', () => {
  it('не пустой', () => {
    expect(PROGRAMS.length).toBeGreaterThan(0);
  });

  it('id уникальны', () => {
    expect(new Set(PROGRAMS.map((program) => program.id)).size).toBe(PROGRAMS.length);
  });

  it('id дедлайнов уникальны по всему каталогу', () => {
    const ids = PROGRAMS.flatMap((program) => program.deadlines.map((deadline) => deadline.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('все значения перечислений валидны', () => {
    for (const program of PROGRAMS) {
      expect(COUNTRIES).toContain(program.country);
      expect(STUDY_LANGUAGES).toContain(program.languageOfStudy);
      expect(program.interests.length).toBeGreaterThan(0);

      for (const interest of program.interests) {
        expect(INTERESTS).toContain(interest);
      }
      for (const requirement of program.requirements) {
        expect(EXAMS).toContain(requirement.exam);
      }
    }
  });

  it('числовые поля осмысленны', () => {
    for (const program of PROGRAMS) {
      if (program.tuitionKztPerYear !== null) {
        expect(program.tuitionKztPerYear).toBeGreaterThan(0);
      }
      if (program.minGpa !== null) {
        expect(program.minGpa).toBeGreaterThanOrEqual(2);
        expect(program.minGpa).toBeLessThanOrEqual(5);
      }
      for (const requirement of program.requirements) {
        if (requirement.minScore !== null) {
          expect(requirement.minScore).toBeGreaterThan(0);
        }
      }
    }
  });

  it('оценки престижа и карьеры — валидный уровень или честный null', () => {
    const levels = [...LEVELS, null];

    for (const program of PROGRAMS) {
      expect(levels).toContain(program.prestige);
      expect(levels).toContain(program.career);
    }
  });

  it('оценки различают программы, иначе приоритеты ни на что не влияют', () => {
    const prestige = new Set(PROGRAMS.map((program) => program.prestige));
    const career = new Set(PROGRAMS.map((program) => program.career));

    expect(prestige.size).toBeGreaterThan(1);
    expect(career.size).toBeGreaterThan(1);
  });

  it('у каждой программы есть источник и дата проверки', () => {
    for (const program of PROGRAMS) {
      expect(program.sourceUrl).toMatch(/^https:\/\//);
      expect(program.checkedAt).toMatch(ISO_DATE);
    }
  });

  it('дедлайн с датой обязан иметь источник', () => {
    for (const program of PROGRAMS) {
      for (const deadline of program.deadlines) {
        if (deadline.date !== null) {
          expect(deadline.date).toMatch(ISO_DATE);
          expect(deadline.sourceUrl).not.toBeNull();
        }
      }
    }
  });

  it('в unverified перечислены только допустимые поля', () => {
    for (const program of PROGRAMS) {
      expect(Array.isArray(program.unverified)).toBe(true);
      expect(new Set(program.unverified).size).toBe(program.unverified.length);

      for (const field of program.unverified) {
        expect(VERIFIABLE_FIELDS).toContain(field);
      }
    }
  });

  it('сверенная программа ведёт источник на конкретную страницу, а не на главную', () => {
    for (const program of PROGRAMS) {
      if (hasUnverifiedFacts(program)) continue;

      // У главной страницы путь пустой или «/» — на ней фактов не найти.
      expect(new URL(program.sourceUrl).pathname.replace(/\/$/, '').length).toBeGreaterThan(0);
    }
  });

  it('пояснение к цене не бывает пустым и не висит без самой цены', () => {
    for (const program of PROGRAMS) {
      if (program.tuitionNote === null) continue;

      expect(program.tuitionNote.length).toBeGreaterThan(0);
      expect(program.tuitionKztPerYear).not.toBeNull();
    }
  });

  it('сверенная зарубежная цена обязана объяснять пересчёт', () => {
    // Ни один зарубежный вуз не публикует стоимость в тенге, значит за любой
    // сверенной цифрой стоит пересчёт по курсу. Без подписи она выглядела бы
    // цитатой из прайса вуза.
    const foreign = PROGRAMS.filter(
      (program) => program.country !== 'KZ' && !isUnverified(program, 'tuitionKztPerYear'),
    );

    expect(foreign.length).toBeGreaterThan(0);
    for (const program of foreign) {
      expect(program.tuitionNote).not.toBeNull();
      expect(program.tuitionNote).toMatch(/курс/i);
    }
  });

  it('покрывает все страны и все направления контракта', () => {
    const countries = new Set(PROGRAMS.map((program) => program.country));
    const interests = new Set(PROGRAMS.flatMap((program) => program.interests));

    for (const country of COUNTRIES) {
      expect(countries).toContain(country);
    }
    for (const interest of INTERESTS) {
      expect(interests).toContain(interest);
    }
  });

  it('в каждой стране хватает программ на выдачу трёх рекомендаций', () => {
    for (const country of COUNTRIES) {
      const inCountry = PROGRAMS.filter((program) => program.country === country);
      expect(inCountry.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('справочник городов', () => {
  it('собран из каталога, без дублей и отсортирован', () => {
    expect(AVAILABLE_CITIES.length).toBeGreaterThan(0);
    expect(new Set(AVAILABLE_CITIES).size).toBe(AVAILABLE_CITIES.length);
    expect([...AVAILABLE_CITIES].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))).toEqual(AVAILABLE_CITIES);
  });

  it('содержит город каждой программы', () => {
    for (const program of PROGRAMS) {
      expect(AVAILABLE_CITIES).toContain(program.city);
    }
  });

  it('города страны — подмножество общего списка и не пусты', () => {
    for (const country of COUNTRIES) {
      const cities = citiesOfCountry(country);

      expect(cities.length).toBeGreaterThan(0);
      for (const city of cities) {
        expect(AVAILABLE_CITIES).toContain(city);
      }
    }
  });

  it('normalizeCity сглаживает регистр и пробелы', () => {
    expect(normalizeCity('  АлМаТы ')).toBe(normalizeCity('алматы'));
  });
});

describe('programById', () => {
  it('находит существующую программу', () => {
    expect(programById('kbtu-is')?.university).toContain('Казахстанско');
  });

  it('возвращает null для неизвестного id', () => {
    expect(programById('нет-такой')).toBeNull();
  });
});
