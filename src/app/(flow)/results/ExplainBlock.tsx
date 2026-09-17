'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Пересказ подбора человеческим языком.
 *
 * Причины от движка остаются на карточках всегда — это не замена разбору, а
 * добавка поверх него. Если модель недоступна или ответила подозрительно,
 * блок просто честно говорит об этом, и экран продолжает работать.
 */
import { useState } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Field';
import type { ExplainResponse } from '@/app/api/explain/route';
import type { Recommendation } from '@/types';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; summary: string }
  | { kind: 'unavailable' };

/** Столько программ отправляем на пересказ — столько же читает человек. */
const TOP = 3;

export function ExplainBlock({ recommendations }: { recommendations: Recommendation[] }) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function explain() {
    setState({ kind: 'loading' });

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programs: recommendations.slice(0, TOP).map((rec) => ({
            university: rec.program.university,
            program: rec.program.program,
            chance: rec.chance,
            reasons: rec.reasons.map((reason) => ({ kind: reason.kind, text: reason.text })),
          })),
        }),
      });

      const data = (await response.json()) as ExplainResponse;

      if (data.ok && data.summary) {
        setState({ kind: 'ready', summary: data.summary });
        return;
      }
      setState({ kind: 'unavailable' });
    } catch {
      setState({ kind: 'unavailable' });
    }
  }

  if (recommendations.length === 0) return null;

  if (state.kind === 'ready') {
    return (
      <Card tone="accent" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">Коротко о подборке</p>
        <p className="text-sm text-ink">{state.summary}</p>
        <p className="text-xs text-muted">
          Пересказ сделан языковой моделью по причинам, которые посчитал движок. Выбор программ
          модель не делала — он полностью на стороне движка.
        </p>
      </Card>
    );
  }

  if (state.kind === 'unavailable') {
    return (
      <Card className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          Пересказ сейчас недоступен. На разбор это не влияет: причины под каждой программой
          посчитаны движком и остаются на месте.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Можно получить короткий пересказ подборки обычными словами.
      </p>
      <button
        type="button"
        onClick={explain}
        disabled={state.kind === 'loading'}
        className={buttonClass('ghost')}
      >
        {state.kind === 'loading' ? 'Готовим пересказ…' : 'Объяснить простыми словами'}
      </button>
    </Card>
  );
}
