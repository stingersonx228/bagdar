/**
 * ВЛАДЕЛЕЦ: лид. Оболочка маршрута: «линия метро» сверху, экран станции снизу.
 * Зона B меняет внутренности MetroProgress, а не этот layout.
 */
import type { ReactNode } from 'react';
import { MetroProgress } from '@/components/ui/MetroProgress';

export default function FlowLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-10">
      <MetroProgress />
      <main className="flex flex-1 flex-col gap-6">{children}</main>
    </div>
  );
}
