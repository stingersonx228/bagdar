'use client';

/**
 * ВЛАДЕЛЕЦ: зона B. Переход на следующую станцию.
 * Адрес берётся из контракта @/lib/flow — экраны не хардкодят href.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonClass } from '@/components/ui/Button';
import { FIRST_FLOW_STEP, nextFlowStep } from '@/lib/flow';

export function StepNav({ label }: { label?: string }) {
  const pathname = usePathname();
  const next = nextFlowStep(pathname);

  if (!next) {
    return (
      <Link href={FIRST_FLOW_STEP.path} className={buttonClass('ghost')}>
        Пройти маршрут заново
      </Link>
    );
  }

  return (
    <Link href={next.path} className={buttonClass('primary')}>
      {label ?? `Дальше: ${next.shortLabel}`}
    </Link>
  );
}
