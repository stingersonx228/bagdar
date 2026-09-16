/** ВЛАДЕЛЕЦ: зона B. Станция 1 — вход в маршрут. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepNav } from '@/components/ui/StepNav';

export default function StartPage() {
  return (
    <>
      <ScreenHeader
        title="Бағдар"
        lead="Маршрут поступления для 10–11 класса: от анкеты до пошагового плана. Каждый этап — станция, и вы всегда видите, где находитесь."
      />
      <div className="mt-auto">
        <StepNav label="Начать маршрут" />
      </div>
    </>
  );
}
