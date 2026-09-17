'use client';

/**
 * ВЛАДЕЛЕЦ: зона B. Карточка программы в рекомендациях.
 *
 * Бейдж «демо-данные» ставится точечно на факт, а не на карточку целиком:
 * у КБТУ стоимость сверена с прайсом, а требования — нет, и красить всю
 * карточку значило бы обесценить проделанную сверку.
 */
import { ChanceBadge, DemoBadge, Tag } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Field';
import { isUnverified } from '@/data';
import { EXAM_LABELS, STUDY_LANGUAGE_LABELS, formatGpa, formatKzt } from '@/engine';
import type { Reason, Recommendation } from '@/types';

const REASON_STYLE: Record<Reason['kind'], string> = {
  match: 'text-ok',
  warning: 'text-warn',
  blocker: 'text-danger',
};

const REASON_MARK: Record<Reason['kind'], string> = {
  match: '+',
  warning: '!',
  blocker: '×',
};

/**
 * Карточка объясняет выбор, а не пересказывает весь разбор. Берём по паре
 * каждого вида: сначала то, что мешает, потом за что программа попала в список,
 * потом оговорки. Просто срезать первые N нельзя — предупреждений почти всегда
 * больше, и они вытеснили бы причины, ради которых карточку читают.
 */
function pickReasons(reasons: Reason[]): Reason[] {
  const of = (kind: Reason['kind']) => reasons.filter((item) => item.kind === kind);
  return [...of('blocker').slice(0, 2), ...of('match').slice(0, 2), ...of('warning').slice(0, 2)];
}

function ReasonList({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {reasons.map((reason) => (
        <li key={reason.code + reason.text} className="flex gap-2 text-sm">
          <span aria-hidden className={`font-bold ${REASON_STYLE[reason.kind]}`}>
            {REASON_MARK[reason.kind]}
          </span>
          <span className="text-ink">{reason.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProgramCard({
  rec,
  compared,
  onToggleCompare,
}: {
  rec: Recommendation;
  compared: boolean;
  onToggleCompare: () => void;
}) {
  const { program } = rec;
  const tuitionUnverified = isUnverified(program, 'tuitionKztPerYear');

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ChanceBadge level={rec.chance} />
          {program.grantAvailable ? <Tag>есть грант</Tag> : null}
        </div>
        <h2 className="text-lg font-semibold text-ink">{program.program}</h2>
        <p className="text-sm text-muted">
          {program.university} · {program.city}
        </p>
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <dt className="text-muted">Стоимость:</dt>
          <dd className="font-medium text-ink">
            {program.tuitionKztPerYear === null
              ? 'вуз не публикует'
              : `${formatKzt(program.tuitionKztPerYear)} в год`}
          </dd>
          {tuitionUnverified ? <DemoBadge title="Стоимость не сверена с сайтом вуза" /> : null}
        </div>
        {program.tuitionNote ? (
          <p className="text-xs text-muted">{program.tuitionNote}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <dt className="text-muted">Язык обучения:</dt>
          <dd className="text-ink">на {STUDY_LANGUAGE_LABELS[program.languageOfStudy]}</dd>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <dt className="text-muted">Требования:</dt>
          <dd className="text-ink">
            {program.requirements.length === 0
              ? 'не указаны'
              : program.requirements
                  .map((req) =>
                    req.minScore === null
                      ? EXAM_LABELS[req.exam]
                      : `${EXAM_LABELS[req.exam]} от ${req.minScore}`,
                  )
                  .join(', ')}
            {program.minGpa === null ? '' : `, GPA от ${formatGpa(program.minGpa)}`}
          </dd>
          {isUnverified(program, 'requirements') ? (
            <DemoBadge title="Требования не сверены с сайтом вуза" />
          ) : null}
        </div>
      </dl>

      <ReasonList reasons={pickReasons(rec.reasons)} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={compared}
            onChange={onToggleCompare}
            className="size-4 accent-line"
          />
          В сравнение
        </label>
        <a
          href={program.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-line underline underline-offset-2"
        >
          Источник
        </a>
      </div>
    </Card>
  );
}
