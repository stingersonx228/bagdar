/**
 * ВЛАДЕЛЕЦ: зона A. Публичный API движка.
 *
 * Правило 1 из CLAUDE.md: выбор вузов делает этот код, а не LLM. Все функции —
 * чистые: без сети, случайности и чтения текущего времени (дата приходит
 * аргументом), поэтому результат воспроизводим в тестах.
 */
export { recommend } from './recommend';
export { diagnose } from './diagnose';
export { buildRoadmap, nextStep } from './roadmap';

export { WEIGHTS } from './scoring';
export {
  COUNTRY_LABELS,
  COUNTRY_LABELS_IN,
  COUNTRY_PREPOSITIONAL,
  ENGLISH_LABELS,
  EXAM_LABELS,
  INTEREST_LABELS,
  STUDY_LANGUAGE_LABELS,
  formatGpa,
  formatKzt,
} from './labels';
