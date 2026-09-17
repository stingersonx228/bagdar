'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Станция 6 — план подготовки, следующий шаг и прогресс.
 *
 * План нарисован той же линией метро, что и обзор маршрута на входе: шаги —
 * это станции, выполненные закрашены, ближайший невыполненный подсвечен. Так
 * метафора доживает до конца пути, а не остаётся в шапке.
 */
import { Card } from '@/components/ui/Field';
import { MetroLine, type Station, type StationState } from '@/components/ui/MetroLine';
import { LoadingState, NeedsProfile } from '@/components/ui/NeedsProfile';
import { StepNav } from '@/components/ui/StepNav';
import { useJourney } from '@/store/useJourney';
import { useJourneyView } from '@/store/useDerived';
import type { RoadmapStep } from '@/types';

const TYPE_LABEL: Record<RoadmapStep['type'], string> = {
  exam: 'Экзамен',
  academic: 'Учёба',
  document: 'Документы',
  deadline: 'Срок',
  activity: 'Активность',
};

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
  return (
    <div
      className={`rounded-card border bg-surface p-4 shadow-card transition-colors ${
        current ? 'border-line' : 'border-hairline'
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          className="mt-0.5 size-5 shrink-0 accent-line"
        />
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-line-dark">
              {TYPE_LABEL[step.type]}
            </span>
            {step.dueDate ? <span className="text-muted">до {step.dueDate}</span> : null}
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

export function RoadmapView() {
  const { hydrated, profile, steps, nextStep, completedStepIds, doneCount } = useJourneyView();
  const toggleStep = useJourney((state) => state.toggleStep);

  if (!hydrated) return <LoadingState what="маршрут" />;
  if (!profile) return <NeedsProfile what="Пошаговый план" />;

  if (steps.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">
          План пустой: под ваши ответы не нашлось ни одной программы, вокруг которой его строить.
        </p>
      </Card>
    );
  }

  const done = new Set(completedStepIds);
  const percent = Math.round((doneCount / steps.length) * 100);

  const stations: Station[] = steps.map((step) => {
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
      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-base font-medium text-ink">
            {nextStep ? 'Следующий шаг' : 'Все шаги выполнены'}
          </p>
          <p className="text-sm tabular-nums text-muted">
            {doneCount} из {steps.length}
          </p>
        </div>
        <p className="text-sm text-ink">
          {nextStep ? nextStep.title : 'Маршрут пройден. Проверьте дедлайны на сайтах программ.'}
        </p>
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
      </Card>

      <MetroLine stations={stations} />

      <StepNav />
    </div>
  );
}
