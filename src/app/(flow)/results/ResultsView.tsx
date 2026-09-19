'use client';

/** ВЛАДЕЛЕЦ: зона C. Станция 4 — рекомендации из движка. */
import Link from 'next/link';
import { Card } from '@/components/ui/Field';
import { LoadingState, NeedsProfile } from '@/components/ui/NeedsProfile';
import { ProgramCard } from '@/components/ui/ProgramCard';
import { StepNav } from '@/components/ui/StepNav';
import { ExplainBlock } from './ExplainBlock';
import { ResultsTuner } from './ResultsTuner';
import { buttonClass } from '@/components/ui/Button';
import { useJourney } from '@/store/useJourney';
import { useJourneyView } from '@/store/useDerived';
import { PROGRAMS } from '@/data';
import type { Recommendation } from '@/types';
import { HIDDEN_LABELS, hiddenSummary } from './hiddenSummary';
import { useChangeDiff, type ChangeDiff } from './useChangeDiff';
import { leversFor } from './levers';
import type { Level, Profile } from '@/types';

const LEVEL_TEXT: Record<Level, string> = { high: 'высокий', medium: 'средний', low: 'низкий' };

function Levers({ profile, rec }: { profile: Profile; rec: Recommendation }) {
  const levers = leversFor(profile, rec);
  if (levers.length === 0) return null;
  return (
    <div
      data-testid="levers"
      className="-mt-2 rounded-b-card border border-t-0 border-hairline bg-line-soft px-4 pb-3 pt-4 text-sm"
    >
      <p className="font-semibold text-line-dark">Что поднимет шанс</p>
      <ul className="mt-1 flex flex-col gap-1">
        {levers.map((lever) => (
          <li key={lever.action} className="text-ink">
            {lever.action} → шанс станет <span className="font-semibold">{LEVEL_TEXT[lever.to]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted">Посчитано тем же движком правил, без AI и процентов.</p>
    </div>
  );
}

/** Подсветка карточек, изменившихся после правки параметров. */
const FLASH_CSS = `@keyframes bagdar-flash {
  0% { box-shadow: 0 0 0 3px var(--color-line); transform: scale(1.015); }
  100% { box-shadow: 0 0 0 0 transparent; transform: scale(1); }
}
.bagdar-flash { animation: bagdar-flash 1.6s ease-out; border-radius: 1rem; }
@media (prefers-reduced-motion: reduce) { .bagdar-flash { animation: none; outline: 2px solid var(--color-line); } }`;

function nameOf(recs: Recommendation[], id: string): string {
  return recs.find((rec) => rec.program.id === id)?.program.university ?? id;
}

function DiffBanner({ diff, all }: { diff: ChangeDiff; all: Recommendation[] }) {
  const lines: string[] = [];
  if (diff.added.length > 0) lines.push(`появились: ${diff.added.map((id) => nameOf(all, id)).join(', ')}`);
  if (diff.removed.length > 0) lines.push(`ушли из топа: ${diff.removed.map((id) => nameOf(all, id)).join(', ')}`);
  if (diff.chanceChanged.length > 0) lines.push(`сменился шанс: ${diff.chanceChanged.length}`);
  if (lines.length === 0 && diff.moved.length > 0) lines.push(`поменялся порядок: ${diff.moved.length}`);
  if (lines.length === 0) return null;

  return (
    <div
      key={diff.stamp}
      role="status"
      aria-live="polite"
      data-testid="results-diff"
      className="bagdar-flash rounded-card border border-line bg-line-soft p-3 text-sm text-line-dark"
    >
      <span className="font-semibold">Подборка пересчитана:</span> {lines.join(' · ')}
    </div>
  );
}

/** Показываем осмысленную верхушку: дальше идут программы с низким совпадением. */
const VISIBLE = 6;

export function ResultsView() {
  const { hydrated, profile, recommendations, compared } = useJourneyView();
  const comparedIds = useJourney((state) => state.comparedIds);
  const toggleSelected = useJourney((state) => state.toggleSelected);
  const toggleCompared = useJourney((state) => state.toggleCompared);

  const diff = useChangeDiff(recommendations.slice(0, VISIBLE));

  if (!hydrated) return <LoadingState what="рекомендации" />;
  if (!profile) return <NeedsProfile what="Подборка программ" />;

  if (recommendations.length === 0) {
    return (
      <Card className="flex flex-col gap-3">
        <p className="text-base font-medium text-ink">Под выбранные страны программ нет</p>
        <p className="text-sm text-muted">
          В каталоге пока нет ни одной программы в этих странах. Добавьте ещё одну страну в анкете.
        </p>
        <Link href="/profile" className={buttonClass('ghost')}>
          Изменить ответы
        </Link>
      </Card>
    );
  }

  const shown = recommendations.slice(0, VISIBLE);
  const hidden = hiddenSummary(profile, PROGRAMS, recommendations, VISIBLE);
  const changed = new Set(diff ? [...diff.added, ...diff.chanceChanged, ...diff.moved] : []);

  return (
    <div className="flex flex-col gap-4">
      <Card tone="accent" className="flex flex-col gap-2">
        <p className="text-sm text-ink">
          Подобрано {recommendations.length} программ. Отметьте те, что интересны, — на следующей
          станции сравним их рядом.
        </p>
        <p className="text-sm text-muted">Выбрано: {compared.length}</p>
        <Link href="/profile" className={buttonClass('ghost')}>
          Изменить ответы
        </Link>
      </Card>

      <style>{FLASH_CSS}</style>
      <ResultsTuner profile={profile} />

      {diff ? <DiffBanner diff={diff} all={recommendations} /> : null}

      {hidden.total > 0 ? (
        <p className="text-sm text-muted" data-testid="hidden-summary">
          Скрыто {hidden.total} вариантов:{' '}
          {hidden.parts.map((part) => `${HIDDEN_LABELS[part.cause]} — ${part.count}`).join(' / ')}
        </p>
      ) : null}

      <ExplainBlock recommendations={recommendations} />

      {shown.map((rec) => (
        <div
          key={changed.has(rec.program.id) ? `${rec.program.id}:${diff?.stamp}` : rec.program.id}
          className={changed.has(rec.program.id) ? 'bagdar-flash' : undefined}
          data-testid="program-card"
        >
        <ProgramCard
          rec={rec}
          compared={comparedIds.includes(rec.program.id)}
          onToggleCompare={() => {
            // selectedProgramIds — «что я рассматриваю», comparedIds — «что кладу
            // рядом на сравнение». На этом экране одно действие задаёт оба,
            // чтобы не заставлять отмечать программу дважды.
            toggleSelected(rec.program.id);
            toggleCompared(rec.program.id);
          }}
        />
        <Levers profile={profile} rec={rec} />
        </div>
      ))}

      <StepNav />
    </div>
  );
}
