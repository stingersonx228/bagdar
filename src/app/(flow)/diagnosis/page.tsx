/** ВЛАДЕЛЕЦ: зона B. Станция 3 — диагностика: сильные стороны, ограничения, цель. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepNav } from '@/components/ui/StepNav';

export default function DiagnosisPage() {
  return (
    <>
      <ScreenHeader
        title="Диагностика"
        lead="Разбор профиля: что уже работает на поступление, что ограничивает выбор и к какой цели ведёт маршрут."
      />
      <div className="mt-auto">
        <StepNav />
      </div>
    </>
  );
}
