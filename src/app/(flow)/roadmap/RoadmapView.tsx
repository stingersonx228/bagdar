'use client';

/** ВЛАДЕЛЕЦ: зона C. Станция 6 — план подготовки, следующий шаг и прогресс. */
import { Card } from '@/components/ui/Field';
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

function StepRow({
  step,
  done,
  highlighted,
  onToggle,
}: {
  step: RoadmapStep;
  done: boolean;
  highlighted: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className={highlighted ? 'border-line ring-2 ring-line-soft' : ''}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          className="mt-1 size-5 shrink-0 accent-line"
        />
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-line-dark">
              {TYPE_LABEL[step.type]}
            </span>
            {step.dueDate ? <span>до {step.dueDate}</span> : null}
            {highlighted ? <span className="font-semibold text-line">следующий шаг</span> : null}
          </span>
          <span className={`text-base font-medium ${done ? 'text-muted line-through' : 'text-ink'}`}>
            {step.title}
          </span>
          <span className="text-sm text-muted">{step.why}</span>
          {step.sourceUrl ? (
            <a
              href={step.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="text-sm font-medium text-line underline underline-offset-2"
            >
              Открыть источник
            </a>
          ) : null}
        </span>
      </label>
    </Card>
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

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-base font-medium text-ink">
            {nextStep ? 'Следующий шаг' : 'Все шаги выполнены'}
          </p>
          <p className="text-sm text-muted">
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

      {steps.map((step) => (
        <StepRow
          key={step.id}
          step={step}
          done={done.has(step.id)}
          highlighted={nextStep?.id === step.id}
          onToggle={() => toggleStep(step.id)}
        />
      ))}

      <StepNav />
    </div>
  );
}
