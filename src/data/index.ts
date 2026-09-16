/**
 * ВЛАДЕЛЕЦ: зона A. Точка входа к данным о программах.
 *
 * Правило 2 из CLAUDE.md: у каждого факта есть sourceUrl и checkedAt. Пока
 * факт не подтверждён источником — программа помечена isDemo: true, и UI
 * обязан показать бейдж «демо-данные». Неизвестный дедлайн — date: null,
 * в интерфейсе «уточнить на сайте», а не выдуманная дата.
 *
 * Приведение типа — граница JSON: структура файла проверяется тестом зоны A.
 */
import type { Country, Program } from '@/types';
import raw from './programs.json';

export const PROGRAMS = raw as Program[];

export function programById(id: string): Program | null {
  return PROGRAMS.find((program) => program.id === id) ?? null;
}

/** Сравнение без учёта регистра и лишних пробелов. */
export function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function sortedUnique(values: string[]): string[] {
  // Сравниваем по кодовым точкам, а не через localeCompare: тот зависит от
  // сборки ICU, и порядок поехал бы между машинами.
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Города, в которых реально есть программы. Зона B показывает выбор из этого
 * списка, а не свободный ввод: иначе «Алматы» и «алматы» разойдутся.
 */
export const AVAILABLE_CITIES: string[] = sortedUnique(PROGRAMS.map((program) => program.city));

export function citiesOfCountry(country: Country): string[] {
  return sortedUnique(
    PROGRAMS.filter((program) => program.country === country).map((program) => program.city),
  );
}
