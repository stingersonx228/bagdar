/**
 * ВЛАДЕЛЕЦ: зона A.
 * Тест фиксирует контракт движка: функции существуют, принимают нужную арность
 * и пока честно падают NotImplementedError. Зона A переписывает этот файл
 * вместе с реализацией — сигнатуры при этом менять нельзя.
 */
import { describe, expect, it } from 'vitest';
import { NotImplementedError, buildRoadmap, diagnose, nextStep, recommend } from '@/engine';
import { PROGRAMS } from '@/data';
import type { Profile } from '@/types';

const PROFILE: Profile = {
  grade: 11,
  interests: ['it'],
  gpa: 4.5,
  languages: { kz: true, ru: true, en: 'b2' },
  exams: [{ id: 'ENT', score: 110, plannedDate: null }],
  countries: ['KZ'],
  budgetKztPerYear: 1_500_000,
  needsGrant: true,
  priorities: ['cost', 'career'],
};

describe('контракт движка', () => {
  it('recommend принимает профиль и программы', () => {
    expect(recommend.length).toBe(2);
    expect(() => recommend(PROFILE, PROGRAMS)).toThrow(NotImplementedError);
  });

  it('diagnose принимает профиль', () => {
    expect(diagnose.length).toBe(1);
    expect(() => diagnose(PROFILE)).toThrow(NotImplementedError);
  });

  it('buildRoadmap принимает профиль, рекомендации и дату', () => {
    expect(buildRoadmap.length).toBe(3);
    expect(() => buildRoadmap(PROFILE, [], new Date('2026-09-16'))).toThrow(NotImplementedError);
  });

  it('nextStep принимает шаги и выполненные id', () => {
    expect(nextStep.length).toBe(2);
    expect(() => nextStep([], [])).toThrow(NotImplementedError);
  });
});
