/** ВЛАДЕЛЕЦ: зона B. Бейджи: шанс, статус причины, непроверенные данные. */
import type { ReactNode } from 'react';
import type { Level } from '@/types';

const BASE =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none';

const CHANCE_STYLE: Record<Level, string> = {
  high: 'bg-ok-soft text-ok',
  medium: 'bg-warn-soft text-warn',
  low: 'bg-danger-soft text-danger',
};

/** Слово обязательно: на один цвет полагаться нельзя. */
const CHANCE_LABEL: Record<Level, string> = {
  high: 'Высокий шанс',
  medium: 'Средний шанс',
  low: 'Низкий шанс',
};

export function ChanceBadge({ level }: { level: Level }) {
  return <span className={`${BASE} ${CHANCE_STYLE[level]}`}>{CHANCE_LABEL[level]}</span>;
}

/**
 * Бейдж непроверенного факта. Ставится точечно на поле, а не на карточку:
 * у программы стоимость может быть сверена с прайсом, а требования — нет.
 */
export function DemoBadge({ title }: { title?: string }) {
  return (
    <span className={`${BASE} bg-demo-soft text-demo`} title={title ?? 'Источник не подтверждён'}>
      демо-данные
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className={`${BASE} bg-line-soft text-line-dark`}>{children}</span>;
}
