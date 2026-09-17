'use client';

/** ВЛАДЕЛЕЦ: зона C. Станция 4 — рекомендации из движка. */
import Link from 'next/link';
import { Card } from '@/components/ui/Field';
import { LoadingState, NeedsProfile } from '@/components/ui/NeedsProfile';
import { ProgramCard } from '@/components/ui/ProgramCard';
import { StepNav } from '@/components/ui/StepNav';
import { buttonClass } from '@/components/ui/Button';
import { useJourney } from '@/store/useJourney';
import { useJourneyView } from '@/store/useDerived';

/** Показываем осмысленную верхушку: дальше идут программы с низким совпадением. */
const VISIBLE = 6;

export function ResultsView() {
  const { hydrated, profile, recommendations, compared } = useJourneyView();
  const comparedIds = useJourney((state) => state.comparedIds);
  const toggleSelected = useJourney((state) => state.toggleSelected);
  const toggleCompared = useJourney((state) => state.toggleCompared);

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

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2 bg-line-soft">
        <p className="text-sm text-ink">
          Подобрано {recommendations.length} программ. Отметьте те, что интересны, — на следующей
          станции сравним их рядом.
        </p>
        <p className="text-sm text-muted">Выбрано: {compared.length}</p>
        <Link href="/profile" className={buttonClass('ghost')}>
          Изменить ответы
        </Link>
      </Card>

      {shown.map((rec) => (
        <ProgramCard
          key={rec.program.id}
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
      ))}

      {recommendations.length > VISIBLE ? (
        <p className="text-sm text-muted">
          Ещё {recommendations.length - VISIBLE} программ подошли слабее и в список не попали.
        </p>
      ) : null}

      <StepNav />
    </div>
  );
}
