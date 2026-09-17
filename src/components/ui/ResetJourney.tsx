'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Полный сброс маршрута.
 *
 * Без этого «пройти заново» только перекидывает на первую станцию, а ответы,
 * выбор и отметки остаются. На демо ноутбук переходит из рук в руки, и
 * следующий человек видит чужой профиль.
 *
 * Сброс подтверждается: он стирает ответы, а это не то действие, которое
 * должно случаться от случайного попадания пальцем.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buttonClass } from '@/components/ui/Button';
import { FIRST_FLOW_STEP } from '@/lib/flow';
import { useJourney } from '@/store/useJourney';

export function ResetJourney() {
  const router = useRouter();
  const reset = useJourney((state) => state.reset);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={buttonClass('ghost')}>
        Начать заново
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        Ответы, выбранные программы и отметки о выполненных шагах будут удалены.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            reset();
            router.push(FIRST_FLOW_STEP.path);
          }}
          className={buttonClass('primary')}
        >
          Да, удалить и начать заново
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={buttonClass('ghost')}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
