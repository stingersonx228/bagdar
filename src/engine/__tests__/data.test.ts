/**
 * ВЛАДЕЛЕЦ: зона A.
 * Каталог программ приходит из JSON, а JSON типами не проверяется. Этот тест —
 * единственная защита от опечатки в стране, интересе или экзамене, и он же
 * держит правило 2: без подтверждённого источника факт помечен isDemo.
 */
import { describe, expect, it } from 'vitest';
import { PROGRAMS, programById } from '@/data';
import type { Country, ExamId, Interest } from '@/types';

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

  it('непроверенные данные помечены isDemo — UI покажет бейдж', () => {
    for (const program of PROGRAMS) {
      expect(typeof program.isDemo).toBe('boolean');
    }
    // Пока ни один факт не подтверждён вручную по официальному сайту.
    expect(PROGRAMS.every((program) => program.isDemo)).toBe(true);
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

describe('programById', () => {
  it('находит существующую программу', () => {
    expect(programById('kbtu-is')?.university).toContain('Казахстанско');
  });

  it('возвращает null для неизвестного id', () => {
    expect(programById('нет-такой')).toBeNull();
  });
});
