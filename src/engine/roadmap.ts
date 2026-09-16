/**
 * ВЛАДЕЛЕЦ: зона A. План подготовки и ближайший шаг.
 *
 * Шаги строятся только из того, что есть в данных и профиле. Требований,
 * которых нет в источнике, движок не придумывает: вместо выдуманного дедлайна
 * появляется шаг «уточнить на сайте» со ссылкой (правило 2).
 */
import type { ExamId, Profile, Recommendation, RoadmapStep } from '@/types';
import { EXAM_LABELS, formatGpa } from './labels';

/** Сколько программ берём в работу: план на 18 вузов никто не выполнит. */
const FOCUS_LIMIT = 4;

/** Порядок шагов без даты: сначала то, что дольше готовить. */
const TYPE_ORDER: Record<RoadmapStep['type'], number> = {
  exam: 0,
  academic: 1,
  document: 2,
  deadline: 3,
  activity: 4,
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface ExamNeed {
  programIds: string[];
  minScore: number | null;
}

function collectExamNeeds(focus: Recommendation[]): Map<ExamId, ExamNeed> {
  const needs = new Map<ExamId, ExamNeed>();

  for (const { program } of focus) {
    for (const requirement of program.requirements) {
      const current = needs.get(requirement.exam) ?? { programIds: [], minScore: null };
      current.programIds.push(program.id);
      if (requirement.minScore !== null) {
        current.minScore =
          current.minScore === null ? requirement.minScore : Math.max(current.minScore, requirement.minScore);
      }
      needs.set(requirement.exam, current);
    }
  }

  return needs;
}

function examSteps(profile: Profile, focus: Recommendation[], today: string): RoadmapStep[] {
  const steps: RoadmapStep[] = [];
  const needs = [...collectExamNeeds(focus).entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));

  for (const [examId, need] of needs) {
    const label = EXAM_LABELS[examId];
    const own = profile.exams.find((exam) => exam.id === examId);
    const why = `Требуется для ${need.programIds.length} из выбранных программ`;

    if (!own) {
      steps.push({
        id: `global:exam:${examId}`,
        type: 'exam',
        title: need.minScore === null ? `Сдать ${label}` : `Сдать ${label} минимум на ${need.minScore}`,
        why,
        dueDate: null,
        sourceUrl: null,
        programIds: need.programIds,
      });
      continue;
    }

    if (own.score === null) {
      const planned = own.plannedDate !== null && own.plannedDate >= today ? own.plannedDate : null;
      steps.push({
        id: `global:exam:${examId}`,
        type: 'exam',
        title: `Сдать ${label}`,
        why: planned ? `${why}. Экзамен уже запланирован` : `${why}. Дата экзамена не назначена`,
        dueDate: planned,
        sourceUrl: null,
        programIds: need.programIds,
      });
      continue;
    }

    if (need.minScore !== null && own.score < need.minScore) {
      steps.push({
        id: `global:exam:${examId}`,
        type: 'exam',
        title: `Поднять ${label} с ${own.score} до ${need.minScore}`,
        why,
        dueDate: null,
        sourceUrl: null,
        programIds: need.programIds,
      });
    }
  }

  return steps;
}

function academicSteps(profile: Profile, focus: Recommendation[]): RoadmapStep[] {
  const thresholds = focus
    .map(({ program }) => program.minGpa)
    .filter((value): value is number => value !== null);

  if (thresholds.length === 0) return [];

  const highest = Math.max(...thresholds);
  if (profile.gpa >= highest) return [];

  const blocked = focus.filter(({ program }) => program.minGpa !== null && program.minGpa > profile.gpa);

  return [
    {
      id: 'global:academic:gpa',
      type: 'academic',
      title: `Подтянуть средний балл до ${formatGpa(highest)}`,
      why: `Сейчас ${formatGpa(profile.gpa)} — этого не хватает для ${blocked.length} программ из списка`,
      dueDate: null,
      sourceUrl: null,
      programIds: blocked.map(({ program }) => program.id),
    },
  ];
}

function deadlineSteps(focus: Recommendation[], today: string): RoadmapStep[] {
  const steps: RoadmapStep[] = [];

  for (const { program } of focus) {
    for (const deadline of program.deadlines) {
      if (deadline.date !== null) {
        // Прошедшие даты в план не тащим.
        if (deadline.date < today) continue;
        steps.push({
          id: `${program.id}:deadline:${deadline.id}`,
          type: 'deadline',
          title: `${deadline.label} — ${program.university}`,
          why: 'Пропустить дедлайн значит потерять год',
          dueDate: deadline.date,
          sourceUrl: deadline.sourceUrl ?? program.sourceUrl,
          programIds: [program.id],
        });
        continue;
      }

      steps.push({
        id: `${program.id}:deadline:${deadline.id}`,
        type: 'deadline',
        title: `Уточнить дедлайн «${deadline.label}» — ${program.university}`,
        why: 'Дата не подтверждена источником, её нужно проверить на сайте программы',
        dueDate: null,
        sourceUrl: deadline.sourceUrl ?? program.sourceUrl,
        programIds: [program.id],
      });
    }
  }

  return steps;
}

function documentSteps(focus: Recommendation[]): RoadmapStep[] {
  const steps: RoadmapStep[] = focus.map(({ program }) => ({
    id: `${program.id}:document:checklist`,
    type: 'document' as const,
    title: `Собрать пакет документов — ${program.university}`,
    why: 'Точный список у каждой программы свой, он есть на официальном сайте',
    dueDate: null,
    sourceUrl: program.sourceUrl,
    programIds: [program.id],
  }));

  const abroad = focus.filter(({ program }) => program.country !== 'KZ');
  if (abroad.length > 0) {
    steps.push({
      id: 'global:document:passport',
      type: 'document',
      title: 'Оформить загранпаспорт',
      why: `В списке ${abroad.length} программ за рубежом — без паспорта подача невозможна`,
      dueDate: null,
      sourceUrl: null,
      programIds: abroad.map(({ program }) => program.id),
    });
  }

  return steps;
}

function activitySteps(profile: Profile, focus: Recommendation[]): RoadmapStep[] {
  if (profile.grade !== 10) return [];

  return [
    {
      id: 'global:activity:prep-year',
      type: 'activity',
      title: 'Использовать год до подачи: олимпиады и проекты по направлению',
      why: 'В 10 классе есть запас времени, которого не будет в 11',
      dueDate: null,
      sourceUrl: null,
      programIds: focus.map(({ program }) => program.id),
    },
  ];
}

export function buildRoadmap(
  profile: Profile,
  recs: Recommendation[],
  today: Date,
): RoadmapStep[] {
  const todayIso = toIsoDate(today);

  // Берём лучшие по score, а не только те, где шанс уже высокий. Программа с
  // низким шансом из-за недобранного балла — это как раз то, ради чего строится
  // план: движок должен показать, что нужно закрыть, а не молча её выбросить.
  //
  // А вот программы мимо направления из плана убираем: медицинский вуз в плане
  // будущего айтишника выглядит поломкой, даже если по гранту и языку он прошёл.
  const onTopic = recs.filter((rec) => !rec.reasons.some((item) => item.code === 'interest_none'));
  const focus = (onTopic.length > 0 ? onTopic : recs).slice(0, FOCUS_LIMIT);

  if (focus.length === 0) return [];

  const steps = [
    ...examSteps(profile, focus, todayIso),
    ...academicSteps(profile, focus),
    ...documentSteps(focus),
    ...deadlineSteps(focus, todayIso),
    ...activitySteps(profile, focus),
  ];

  return steps.sort((a, b) => {
    if (a.dueDate !== null && b.dueDate !== null) {
      if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    } else if (a.dueDate !== null) {
      return -1;
    } else if (b.dueDate !== null) {
      return 1;
    }

    const byType = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    if (byType !== 0) return byType;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function nextStep(steps: RoadmapStep[], completedIds: string[]): RoadmapStep | null {
  const done = new Set(completedIds);
  return steps.find((step) => !done.has(step.id)) ?? null;
}
