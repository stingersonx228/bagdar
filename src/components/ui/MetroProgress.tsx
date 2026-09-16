'use client';

/**
 * ВЛАДЕЛЕЦ: зона B. «Линия метро» — прогресс по станциям маршрута.
 * Простая рабочая версия: линия, станции, отметка «вы здесь».
 * Источник станций — контракт @/lib/flow, править список здесь нельзя.
 */
import { usePathname } from 'next/navigation';
import { FLOW_STEPS, flowIndexByPath } from '@/lib/flow';

export function MetroProgress() {
  const pathname = usePathname();
  const currentIndex = flowIndexByPath(pathname);

  if (currentIndex === -1) return null;

  const current = FLOW_STEPS[currentIndex];

  return (
    <nav aria-label="Прогресс маршрута" className="flex flex-col gap-2">
      <ol className="flex items-center">
        {FLOW_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <span
                aria-current={isCurrent ? 'step' : undefined}
                title={step.label}
                className={[
                  'block shrink-0 rounded-full transition-colors',
                  isCurrent
                    ? 'size-4 bg-line-soft ring-4 ring-line'
                    : isDone
                      ? 'size-3 bg-station-done'
                      : 'size-3 bg-station',
                ].join(' ')}
              />
              <span className="sr-only">{step.label}</span>
              {index < FLOW_STEPS.length - 1 ? (
                <span className={`h-0.5 flex-1 ${isDone ? 'bg-station-done' : 'bg-station'}`} />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-muted">
        Станция {currentIndex + 1} из {FLOW_STEPS.length} — вы здесь:{' '}
        <span className="font-medium text-ink">{current.label}</span>
      </p>
    </nav>
  );
}
