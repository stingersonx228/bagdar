/** ВЛАДЕЛЕЦ: зона C. Станция 5 — сравнение выбранных программ (минимум 2). */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepNav } from '@/components/ui/StepNav';

export default function ComparePage() {
  return (
    <>
      <ScreenHeader
        title="Сравнение"
        lead="Выбранные программы рядом: стоимость, грант, требования, язык обучения и дедлайны с указанием источника."
      />
      <div className="mt-auto">
        <StepNav />
      </div>
    </>
  );
}
