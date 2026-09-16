/** ВЛАДЕЛЕЦ: зона C. Станция 6 — маршрут: шаги, следующий шаг и прогресс. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepNav } from '@/components/ui/StepNav';

export default function RoadmapPage() {
  return (
    <>
      <ScreenHeader
        title="Маршрут"
        lead="Пошаговый план до поступления: экзамены, документы и дедлайны. Отмечайте выполненное — прогресс сохраняется."
      />
      <div className="mt-auto">
        <StepNav />
      </div>
    </>
  );
}
