'use client';

/**
 * ВЛАДЕЛЕЦ: зона B. «Линия метро» — прогресс по станциям маршрута.
 *
 * Пройденные станции кликабельны: вернуться и поправить ответ — обычное дело,
 * и заставлять ради этого искать кнопку внизу экрана незачем. Будущие станции
 * ссылками не делаем, чтобы линия оставалась маршрутом, а не меню.
 *
 * Источник станций — контракт @/lib/flow, править список здесь нельзя.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FLOW_STEPS, flowIndexByPath } from '@/lib/flow';

const HIT = 'flex min-h-11 flex-1 items-center last:flex-none';

export function MetroProgress() {
  const pathname = usePathname();
  const currentIndex = flowIndexByPath(pathname);

  if (currentIndex === -1) return null;

  const current = FLOW_STEPS[currentIndex];

  return (
    <nav aria-label="Прогресс маршрута" className="flex flex-col gap-1">
      <ol className="flex items-center">
        {FLOW_STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          const dot = (
            <span
              aria-hidden
              className={[
                'block shrink-0 rounded-full transition-colors',
                isCurrent
                  ? 'size-4 bg-surface ring-4 ring-line'
                  : isDone
                    ? 'size-3 bg-station-done'
                    : 'size-3 bg-station',
              ].join(' ')}
            />
          );

          return (
            <li key={step.id} className={HIT}>
              {isDone ? (
                <Link
                  href={step.path}
                  aria-label={`Вернуться: ${step.label}`}
                  className="flex min-h-11 items-center rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line"
                >
                  {dot}
                </Link>
              ) : (
                <span aria-current={isCurrent ? 'step' : undefined} className="flex items-center pr-1">
                  {dot}
                  <span className="sr-only">{step.label}</span>
                </span>
              )}
              {index < FLOW_STEPS.length - 1 ? (
                <span className={`h-0.5 flex-1 rounded-full ${isDone ? 'bg-station-done' : 'bg-station'}`} />
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
