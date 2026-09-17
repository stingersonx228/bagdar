/** ВЛАДЕЛЕЦ: зона C. Станция 5 — сравнение выбранных программ. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CompareView } from './CompareView';

export default function ComparePage() {
  return (
    <>
      <ScreenHeader
        title="Сравнение"
        lead="Выбранные программы строка к строке: стоимость, грант, требования и сроки."
      />
      <CompareView />
    </>
  );
}
