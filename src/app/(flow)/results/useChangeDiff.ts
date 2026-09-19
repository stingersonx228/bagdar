'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Что изменилось в выдаче после правки профиля.
 *
 * Жюри двигает бюджет — и должно увидеть не «какой-то другой список», а
 * конкретно: какие программы пришли, какие ушли, у кого сменился шанс. Снимок
 * прошлой выдачи хранится в state и сравнивается прямо в рендере (паттерн
 * «adjust state on prop change» из документации React), без эффектов.
 */
import { useState } from 'react';
import type { Level, Recommendation } from '@/types';

export interface ChangeDiff {
  /** Номер правки: меняется при каждом пересчёте, перезапускает подсветку. */
  stamp: number;
  added: string[];
  removed: string[];
  chanceChanged: string[];
  moved: string[];
}

interface Snapshot {
  signature: string;
  chances: Map<string, Level>;
  order: string[];
  diff: ChangeDiff | null;
}

function snapshotOf(shown: Recommendation[]): Omit<Snapshot, 'diff'> {
  return {
    signature: shown.map((rec) => `${rec.program.id}:${rec.chance}`).join('|'),
    chances: new Map(shown.map((rec) => [rec.program.id, rec.chance])),
    order: shown.map((rec) => rec.program.id),
  };
}

export function useChangeDiff(shown: Recommendation[]): ChangeDiff | null {
  const next = snapshotOf(shown);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ ...next, diff: null }));

  if (snapshot.signature !== next.signature) {
    const before = new Set(snapshot.order);
    const after = new Set(next.order);
    const diff: ChangeDiff = {
      stamp: (snapshot.diff?.stamp ?? 0) + 1,
      added: next.order.filter((id) => !before.has(id)),
      removed: snapshot.order.filter((id) => !after.has(id)),
      chanceChanged: next.order.filter(
        (id) => before.has(id) && snapshot.chances.get(id) !== next.chances.get(id),
      ),
      moved: next.order.filter(
        (id, index) => before.has(id) && snapshot.order.indexOf(id) !== index,
      ),
    };
    // Первая выдача после загрузки — не «изменение», подсвечивать нечего.
    const real = snapshot.order.length > 0 ? diff : null;
    setSnapshot({ ...next, diff: real });
    return real;
  }

  return snapshot.diff;
}
