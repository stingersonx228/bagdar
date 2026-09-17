/** ВЛАДЕЛЕЦ: зона C. Станция 6 — маршрут: шаги, следующий шаг и прогресс. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { RoadmapView } from './RoadmapView';

export default function RoadmapPage() {
  return (
    <>
      <ScreenHeader
        title="Маршрут"
        lead="Пошаговый план до поступления. Отмечайте выполненное — прогресс сохраняется на устройстве."
      />
      <RoadmapView />
    </>
  );
}
