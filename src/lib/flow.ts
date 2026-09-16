/**
 * Контракт пути («линия метро»).
 * ВЛАДЕЛЕЦ: лид. Порядок станций живёт здесь и только здесь: из него берут
 * данные и навигация (StepNav), и прогресс (MetroProgress). Никаких
 * захардкоженных href между экранами — иначе зоны B и C разъедутся.
 */

export type FlowStepId = 'start' | 'profile' | 'diagnosis' | 'results' | 'compare' | 'roadmap';

export interface FlowStep {
  id: FlowStepId;
  path: string;
  /** Подпись станции в прогрессе. */
  label: string;
  /** Короткое название шага для кнопки «дальше». */
  shortLabel: string;
  /** Зона, которая отвечает за экран (см. CLAUDE.md). */
  zone: 'B' | 'C';
}

export const FLOW_STEPS = [
  { id: 'start', path: '/start', label: 'Начало', shortLabel: 'Начало', zone: 'B' },
  { id: 'profile', path: '/profile', label: 'Анкета', shortLabel: 'Анкета', zone: 'B' },
  { id: 'diagnosis', path: '/diagnosis', label: 'Диагностика', shortLabel: 'Диагностика', zone: 'B' },
  { id: 'results', path: '/results', label: 'Рекомендации', shortLabel: 'Рекомендации', zone: 'C' },
  { id: 'compare', path: '/compare', label: 'Сравнение', shortLabel: 'Сравнение', zone: 'C' },
  { id: 'roadmap', path: '/roadmap', label: 'Маршрут', shortLabel: 'Маршрут', zone: 'C' },
] as const satisfies readonly FlowStep[];

export const FIRST_FLOW_STEP: FlowStep = FLOW_STEPS[0];

/** Индекс текущей станции, -1 если путь не относится к flow. */
export function flowIndexByPath(pathname: string): number {
  return FLOW_STEPS.findIndex((step) => pathname === step.path || pathname.startsWith(`${step.path}/`));
}

export function flowStepByPath(pathname: string): FlowStep | null {
  const index = flowIndexByPath(pathname);
  return index === -1 ? null : FLOW_STEPS[index];
}

/** Следующая станция, null — если текущая последняя или путь вне flow. */
export function nextFlowStep(pathname: string): FlowStep | null {
  const index = flowIndexByPath(pathname);
  if (index === -1) return null;
  return FLOW_STEPS[index + 1] ?? null;
}
