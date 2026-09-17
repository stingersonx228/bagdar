/** ВЛАДЕЛЕЦ: зона B. Станция 3 — диагностика: сильные стороны, ограничения, цель. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DiagnosisView } from './DiagnosisView';

export default function DiagnosisPage() {
  return (
    <>
      <ScreenHeader
        title="Диагностика"
        lead="Что в вашем профиле работает на поступление, что ограничивает выбор и к какой цели ведёт маршрут."
      />
      <DiagnosisView />
    </>
  );
}
