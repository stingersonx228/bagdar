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
import type { Program } from '@/types';
import raw from './programs.json';

export const PROGRAMS = raw as Program[];

export function programById(id: string): Program | null {
  return PROGRAMS.find((program) => program.id === id) ?? null;
}
