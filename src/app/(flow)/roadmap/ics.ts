/**
 * ВЛАДЕЛЕЦ: зона C. Экспорт плана в календарь (.ics, RFC 5545).
 *
 * Файл собирается в браузере: сервер и сторонние библиотеки не нужны.
 * В календарь попадают ТОЛЬКО шаги с реальной датой — шаг «уточнить на сайте»
 * с выдуманной датой был бы ровно той неподтверждённой датой, которую
 * запрещает кейс.
 */
import type { RoadmapStep } from '@/types';

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function compactDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function nextDay(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export function datedSteps(steps: RoadmapStep[]): RoadmapStep[] {
  return steps.filter((step) => step.dueDate !== null && /^\d{4}-\d{2}-\d{2}/.test(step.dueDate));
}

export function buildIcs(steps: RoadmapStep[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = datedSteps(steps).flatMap((step) => {
    const due = step.dueDate ?? '';
    const description = [step.why, step.sourceUrl ? `Источник: ${step.sourceUrl}` : '']
      .filter(Boolean)
      .join('\n');
    return [
      'BEGIN:VEVENT',
      `UID:${step.id.replace(/[^A-Za-z0-9:_-]/g, '-')}@bagdar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(due)}`,
      `DTEND;VALUE=DATE:${nextDay(due)}`,
      `SUMMARY:${escapeText(step.title)}`,
      `DESCRIPTION:${escapeText(description)}`,
      ...(step.sourceUrl ? [`URL:${step.sourceUrl}`] : []),
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`Через неделю: ${step.title}`)}`,
      'END:VALARM',
      'END:VEVENT',
    ];
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bagdar//Admission Roadmap//RU',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Бағдар — маршрут поступления',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(steps: RoadmapStep[]): void {
  const blob = new Blob([buildIcs(steps, new Date())], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bagdar-roadmap.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
