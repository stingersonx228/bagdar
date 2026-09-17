'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Станция 5 — сравнение выбранных программ.
 *
 * На 375px таблица не помещается, поэтому она горизонтально прокручивается,
 * а колонка с названием строки закреплена: иначе, доскроллив до третьего вуза,
 * человек уже не понимает, что за цифру видит.
 */
import Link from 'next/link';
import { ChanceBadge, DemoBadge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Field';
import { LoadingState, NeedsProfile } from '@/components/ui/NeedsProfile';
import { StepNav } from '@/components/ui/StepNav';
import { isUnverified } from '@/data';
import { EXAM_LABELS, STUDY_LANGUAGE_LABELS, formatGpa, formatKzt } from '@/engine';
import { useJourney } from '@/store/useJourney';
import { useJourneyView } from '@/store/useDerived';
import type { Program, Recommendation, VerifiableField } from '@/types';

interface Row {
  label: string;
  field: VerifiableField | null;
  render: (program: Program, rec: Recommendation) => string;
}

const ROWS: Row[] = [
  { label: 'Город', field: null, render: (program) => program.city },
  {
    label: 'Стоимость в год',
    field: 'tuitionKztPerYear',
    render: (program) =>
      program.tuitionKztPerYear === null ? 'вуз не публикует' : formatKzt(program.tuitionKztPerYear),
  },
  {
    label: 'Грант',
    field: 'grantAvailable',
    render: (program) => (program.grantAvailable ? 'есть' : 'нет'),
  },
  {
    label: 'Язык обучения',
    field: null,
    // Подписи в словаре стоят в предложном падеже под оборот «обучение на …»,
    // поэтому предлог нужен и здесь, иначе в таблице выходит «английском».
    render: (program) => `на ${STUDY_LANGUAGE_LABELS[program.languageOfStudy]}`,
  },
  {
    label: 'Экзамены',
    field: 'requirements',
    render: (program) =>
      program.requirements.length === 0
        ? 'не указаны'
        : program.requirements
            .map((req) =>
              req.minScore === null ? EXAM_LABELS[req.exam] : `${EXAM_LABELS[req.exam]} от ${req.minScore}`,
            )
            .join(', '),
  },
  {
    label: 'Средний балл',
    field: 'minGpa',
    render: (program) => (program.minGpa === null ? 'не публикуется' : `от ${formatGpa(program.minGpa)}`),
  },
  {
    label: 'Дедлайн подачи',
    field: 'deadlines',
    render: (program) => {
      const dated = program.deadlines.find((deadline) => deadline.date !== null);
      if (dated?.date) return dated.date;
      return 'уточнить на сайте';
    },
  },
];

export function CompareView() {
  const { hydrated, profile, compared, recommendations } = useJourneyView();
  const toggleCompared = useJourney((state) => state.toggleCompared);

  if (!hydrated) return <LoadingState what="сравнение" />;
  if (!profile) return <NeedsProfile what="Сравнение программ" />;

  if (compared.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <p className="text-base font-medium text-ink">Пока нечего сравнивать</p>
          <p className="text-sm text-muted">
            Вернитесь к рекомендациям и отметьте хотя бы две программы — тогда увидите их рядом,
            строка к строке.
          </p>
          <Link href="/results" className={buttonClass('primary')}>
            К рекомендациям
          </Link>
        </Card>
        <StepNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {compared.length === 1 ? (
        <Card className="bg-warn-soft">
          <p className="text-sm text-ink">
            Выбрана одна программа. Сравнение имеет смысл от двух — отметьте ещё одну в
            рекомендациях, разница станет видна сразу.
          </p>
        </Card>
      ) : null}

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-canvas p-2 text-left align-bottom text-muted">
                Программа
              </th>
              {compared.map(({ program }) => (
                <th key={program.id} className="min-w-44 p-2 text-left align-bottom">
                  <span className="block font-semibold text-ink">{program.program}</span>
                  <span className="block text-xs font-normal text-muted">{program.university}</span>
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-10 bg-canvas p-2 text-left text-muted">Шанс</th>
              {compared.map((rec) => (
                <td key={rec.program.id} className="p-2">
                  <ChanceBadge level={rec.chance} />
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-hairline">
                <th scope="row" className="sticky left-0 z-10 bg-canvas p-2 text-left font-normal text-muted">
                  {row.label}
                </th>
                {compared.map((rec) => (
                  <td key={rec.program.id} className="p-2 align-top text-ink">
                    <span className="block">{row.render(rec.program, rec)}</span>
                    {row.field && isUnverified(rec.program, row.field) ? (
                      <span className="mt-1 block">
                        <DemoBadge />
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-hairline">
              <th scope="row" className="sticky left-0 z-10 bg-canvas p-2 text-left font-normal text-muted">
                Убрать
              </th>
              {compared.map((rec) => (
                <td key={rec.program.id} className="p-2">
                  <button
                    type="button"
                    onClick={() => toggleCompared(rec.program.id)}
                    className="min-h-11 text-sm font-medium text-line underline underline-offset-2"
                  >
                    Убрать
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted">
        Маршрут на следующей станции построится вокруг этих {compared.length} программ
        {recommendations.length > compared.length ? ', остальные в план не попадут' : ''}.
      </p>

      <StepNav />
    </div>
  );
}
