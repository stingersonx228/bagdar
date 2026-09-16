/**
 * ВЛАДЕЛЕЦ: зона A. Детерминированный движок подбора.
 *
 * Правило 1 из CLAUDE.md: выбор вузов делает ЭТОТ код, а не LLM. Движок —
 * чистые функции без сети, случайности и чтения времени изнутри (сегодняшняя
 * дата приходит аргументом), чтобы результат был воспроизводим в тестах.
 *
 * Правило 3: никаких процентов шансов — только Level (high | medium | low)
 * плюс reasons[] с объяснением.
 *
 * Сигнатуры зафиксированы лидом. Реализацию пишет зона A, заменяя throw.
 */
import type { Diagnosis, Profile, Program, Recommendation, RoadmapStep } from '@/types';

export class NotImplementedError extends Error {
  constructor(fn: string) {
    super(`Движок: ${fn}() ещё не реализован (зона A)`);
    this.name = 'NotImplementedError';
  }
}

/**
 * Подбирает программы под профиль и объясняет каждый выбор.
 * Возвращает список, отсортированный по score по убыванию; на экран нужно ≥3.
 */
export function recommend(profile: Profile, programs: Program[]): Recommendation[] {
  void profile;
  void programs;
  throw new NotImplementedError('recommend');
}

/** Разбор профиля: сильные стороны, ограничения и цель маршрута. */
export function diagnose(profile: Profile): Diagnosis {
  void profile;
  throw new NotImplementedError('diagnose');
}

/**
 * Строит план подготовки из профиля и подобранных программ.
 * `today` передаётся аргументом — от неё считаются сроки.
 */
export function buildRoadmap(profile: Profile, recs: Recommendation[], today: Date): RoadmapStep[] {
  void profile;
  void recs;
  void today;
  throw new NotImplementedError('buildRoadmap');
}

/** Ближайший невыполненный шаг маршрута; null — если выполнены все. */
export function nextStep(steps: RoadmapStep[], completedIds: string[]): RoadmapStep | null {
  void steps;
  void completedIds;
  throw new NotImplementedError('nextStep');
}
