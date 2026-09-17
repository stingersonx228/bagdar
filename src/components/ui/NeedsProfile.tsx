/**
 * ВЛАДЕЛЕЦ: зона B. Состояния «ещё грузим» и «анкета не заполнена».
 * Нужны на каждом экране после анкеты: без профиля считать нечего, и молча
 * показывать пустоту нельзя (правило 6).
 */
import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Field';

export function LoadingState({ what }: { what: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">Загружаем {what}…</p>
    </Card>
  );
}

export function NeedsProfile({ what }: { what: string }) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-base font-medium text-ink">Сначала анкета</p>
      <p className="text-sm text-muted">
        {what} считается из ваших ответов. Заполните анкету — это минута, и там есть готовый пример.
      </p>
      <Link href="/profile" className={buttonClass('primary')}>
        Перейти к анкете
      </Link>
    </Card>
  );
}
