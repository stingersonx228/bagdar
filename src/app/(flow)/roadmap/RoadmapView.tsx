'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Станция 6 — план подготовки, следующий шаг и прогресс.
 *
 * План нарисован той же линией метро, что и обзор маршрута на входе: шаги —
 * это станции, выполненные закрашены, ближайший невыполненный подсвечен. Так
 * метафора доживает до конца пути, а не остаётся в шапке.
 */
import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Field';
import { MetroLine, type Station, type StationState } from '@/components/ui/MetroLine';
import { LoadingState, NeedsProfile } from '@/components/ui/NeedsProfile';
import { ResetJourney } from '@/components/ui/ResetJourney';
import { StepNav } from '@/components/ui/StepNav';
import { useJourney } from '@/store/useJourney';
import { useJourneyView } from '@/store/useDerived';
import type { RoadmapStep } from '@/types';
import { datedSteps, downloadIcs } from './ics';

const TYPE_LABEL: Record<RoadmapStep['type'], string> = {
  exam: 'Экзамен',
  academic: 'Учёба',
  document: 'Документы',
  deadline: 'Срок',
  activity: 'Активность',
};

/** Каждый тип шага — своя «линия метро»: цвет узнаётся раньше, чем читается текст. */
const TYPE_COLOR: Record<RoadmapStep['type'], string> = {
  exam: '#2563eb',
  academic: '#0b7a5b',
  document: '#c2410c',
  deadline: '#b91c1c',
  activity: '#7c3aed',
};

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return `${day} ${MONTHS[month - 1]?.slice(0, 3) ?? ''} ${year}`;
}

function monthKey(step: RoadmapStep): string {
  return step.dueDate ? step.dueDate.slice(0, 7) : 'none';
}

function monthTitle(key: string): string {
  if (key === 'none') return 'Без точной даты — уточнить на сайте';
  const [year, month] = key.split('-').map(Number);
  const name = MONTHS[month - 1] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

function isOverdue(step: RoadmapStep, done: boolean): boolean {
  return !done && step.dueDate !== null && step.dueDate.slice(0, 10) < TODAY_ISO;
}

function StepBlock({
  step,
  done,
  current,
  onToggle,
}: {
  step: RoadmapStep;
  done: boolean;
  current: boolean;
  onToggle: () => void;
}) {
  const overdue = isOverdue(step, done);
  return (
    <div
      data-testid="roadmap-step"
      className={`rounded-card border border-l-4 bg-surface p-4 shadow-card transition-colors ${
        overdue ? 'border-danger' : current ? 'border-line' : 'border-hairline'
      }`}
      style={{ borderLeftColor: TYPE_COLOR[step.type] }}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          aria-label={`Выполнено: ${step.title}`}
          className="mt-0.5 size-5 shrink-0 accent-line"
        />
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-full px-2 py-0.5 font-medium text-white"
              style={{ backgroundColor: TYPE_COLOR[step.type] }}
            >
              {TYPE_LABEL[step.type]}
            </span>
            {step.dueDate ? (
              <span className={overdue ? 'font-semibold text-danger' : 'text-muted'}>
                до {formatDate(step.dueDate)}
              </span>
            ) : (
              <span className="text-muted">дата: уточнить на сайте</span>
            )}
            {overdue ? (
              <span className="rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-danger">
                просрочено
              </span>
            ) : null}
            {current ? <span className="font-semibold text-line">вы здесь</span> : null}
          </span>
          <span
            className={`text-base font-medium ${done ? 'text-muted line-through' : 'text-ink'}`}
          >
            {step.title}
          </span>
          <span className="text-sm text-muted">{step.why}</span>
        </span>
      </label>
      {step.sourceUrl ? (
        <a
          href={step.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block pl-8 text-sm font-medium text-line underline underline-offset-2"
        >
          Открыть источник
        </a>
      ) : null}
    </div>
  );
}

function NextStepHero({
  step,
  onDone,
}: {
  step: RoadmapStep;
  onDone: () => void;
}) {
  const overdue = isOverdue(step, false);
  return (
    <section
      aria-label="Следующий шаг"
      data-testid="next-step"
      className="flex flex-col gap-3 rounded-card p-5 text-white shadow-card"
      style={{ backgroundColor: TYPE_COLOR[step.type] }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
        Следующая станция · {TYPE_LABEL[step.type]}
      </p>
      <h2 className="text-xl font-semibold leading-snug">{step.title}</h2>
      <p className="text-sm opacity-95">
        <span className="font-semibold">Зачем: </span>
        {step.why}
      </p>
      <p className="text-sm font-medium">
        {step.dueDate
          ? `${overdue ? 'Срок прошёл: ' : 'До '}${formatDate(step.dueDate)}`
          : 'Точной даты нет — уточните на сайте вуза'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDone}
          className="min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-ink"
        >
          Готово, дальше
        </button>
        {step.sourceUrl ? (
          <a
            href={step.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-full border border-white/70 px-5 text-sm font-semibold"
          >
            Источник
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function RoadmapView() {
  const { hydrated, profile, steps, nextStep, completedStepIds, doneCount } = useJourneyView();
  const toggleStep = useJourney((state) => state.toggleStep);

  if (!hydrated) return <LoadingState what="маршрут" />;
  if (!profile) return <NeedsProfile what="Пошаговый план" />;

  if (steps.length === 0) {
    return (
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          План пустой: под ваши ответы не нашлось ни одной программы, вокруг которой его строить.
        </p>
        <Link href="/results" className={buttonClass('primary')}>
          Вернуться к подбору
        </Link>
      </Card>
    );
  }

  const done = new Set(completedStepIds);
  const percent = Math.round((doneCount / steps.length) * 100);
  const overdueCount = steps.filter((step) => isOverdue(step, done.has(step.id))).length;
  const dated = datedSteps(steps).length;

  const groups = new Map<string, RoadmapStep[]>();
  for (const step of steps) {
    const key = monthKey(step);
    groups.set(key, [...(groups.get(key) ?? []), step]);
  }
  const orderedKeys = [...groups.keys()].sort((a, b) =>
    a === 'none' ? 1 : b === 'none' ? -1 : a < b ? -1 : a > b ? 1 : 0,
  );

  const stationsOf = (list: RoadmapStep[]): Station[] =>
    list.map((step) => {
      const isDone = done.has(step.id);
      const isCurrent = nextStep?.id === step.id;
      const state: StationState = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';
      return {
        key: step.id,
        state,
        content: (
          <StepBlock
            step={step}
            done={isDone}
            current={isCurrent}
            onToggle={() => toggleStep(step.id)}
          />
        ),
      };
    });

  return (
    <div className="flex flex-col gap-5">
      {nextStep ? (
        <NextStepHero step={nextStep} onDone={() => toggleStep(nextStep.id)} />
      ) : (
        <Card tone="accent">
          <p className="text-base font-medium text-ink">Все шаги выполнены</p>
          <p className="text-sm text-muted">Маршрут пройден. Проверьте дедлайны на сайтах программ.</p>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-base font-medium text-ink">Прогресс маршрута</p>
          <p className="text-sm tabular-nums text-muted" data-testid="progress-count">
            {doneCount} из {steps.length}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-station"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Прогресс маршрута"
        >
          <div className="h-full bg-line transition-all" style={{ width: `${percent}%` }} />
        </div>
        {overdueCount > 0 ? (
          <p className="text-sm font-medium text-danger">
            Просрочено шагов: {overdueCount}. Проверьте на сайте вуза, можно ли ещё успеть.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {(Object.keys(TYPE_LABEL) as RoadmapStep['type'][]).map((type) => (
            <span key={type} className="flex items-center gap-1">
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: TYPE_COLOR[type] }}
              />
              {TYPE_LABEL[type]}
            </span>
          ))}
        </div>
        <button
          type="button"
          disabled={dated === 0}
          onClick={() => downloadIcs(steps)}
          className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-line disabled:opacity-50"
        >
          {dated === 0 ? 'Нет шагов с точной датой для календаря' : `Добавить в календарь (.ics, ${dated})`}
        </button>
      </Card>

      {orderedKeys.map((key) => (
        <section key={key} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {monthTitle(key)}
          </h3>
          <MetroLine stations={stationsOf(groups.get(key) ?? [])} />
        </section>
      ))}

      <StepNav />
      <ResetJourney />
    </div>
  );
}
