'use client';

/** ВЛАДЕЛЕЦ: зона B. Станция 3 — разбор профиля перед подбором. */
import { Card } from '@/components/ui/Field';
import { LoadingState, NeedsProfile } from '@/components/ui/NeedsProfile';
import { StepNav } from '@/components/ui/StepNav';
import { useJourneyView } from '@/store/useDerived';

function Points({ title, items, tone }: { title: string; items: string[]; tone: 'ok' | 'warn' }) {
  if (items.length === 0) return null;

  const mark = tone === 'ok' ? '+' : '!';
  const color = tone === 'ok' ? 'text-ok' : 'text-warn';

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-ink">
            <span aria-hidden className={`font-bold ${color}`}>
              {mark}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function DiagnosisView() {
  const { hydrated, profile, diagnosis, recommendations } = useJourneyView();

  if (!hydrated) return <LoadingState what="диагностику" />;
  if (!profile || !diagnosis) return <NeedsProfile what="Разбор профиля" />;

  return (
    <div className="flex flex-col gap-4">
      <Card tone="accent" className="flex flex-col gap-1">
        <p className="text-sm text-muted">Цель маршрута</p>
        <p className="text-base font-medium text-ink">{diagnosis.goal}</p>
      </Card>

      <Points title="На что опереться" items={diagnosis.strengths} tone="ok" />
      <Points title="Что ограничивает выбор" items={diagnosis.limits} tone="warn" />

      <p className="text-sm text-muted">
        Под эти ответы движок нашёл {recommendations.length} подходящих программ.
      </p>

      <StepNav />
    </div>
  );
}
