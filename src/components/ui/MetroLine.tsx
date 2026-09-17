/**
 * ВЛАДЕЛЕЦ: зона B. Вертикальная линия метро со станциями.
 *
 * Метафора маршрута должна жить не только в полоске прогресса сверху, иначе
 * концепция заявлена в описании, а на экране обычный список. Этот компонент —
 * общий для обзора пути на входе и для плана подготовки.
 */
import type { ReactNode } from 'react';

export type StationState = 'done' | 'current' | 'upcoming';

const DOT: Record<StationState, string> = {
  done: 'bg-line border-line',
  current: 'bg-surface border-line ring-4 ring-line-soft',
  upcoming: 'bg-surface border-station',
};

const CONNECTOR: Record<StationState, string> = {
  done: 'bg-line',
  current: 'bg-station',
  upcoming: 'bg-station',
};

export interface Station {
  key: string;
  state: StationState;
  content: ReactNode;
}

export function MetroLine({ stations }: { stations: Station[] }) {
  return (
    <ol className="flex flex-col">
      {stations.map((station, index) => {
        const last = index === stations.length - 1;

        return (
          <li key={station.key} className="flex gap-4">
            <div className="flex flex-col items-center" aria-hidden>
              <span
                className={`mt-1.5 block size-4 shrink-0 rounded-full border-2 transition-colors ${DOT[station.state]}`}
              />
              {last ? null : (
                <span className={`w-0.5 flex-1 rounded-full ${CONNECTOR[station.state]}`} />
              )}
            </div>
            <div className={`flex-1 ${last ? '' : 'pb-5'}`}>{station.content}</div>
          </li>
        );
      })}
    </ol>
  );
}
