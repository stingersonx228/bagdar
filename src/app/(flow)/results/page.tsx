/** ВЛАДЕЛЕЦ: зона C. Станция 4 — рекомендации (минимум 3 программы с объяснением). */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepNav } from '@/components/ui/StepNav';

export default function ResultsPage() {
  return (
    <>
      <ScreenHeader
        title="Рекомендации"
        lead="Программы, подобранные движком под ваш профиль: шанс high / medium / low и причины, почему программа попала в список."
      />
      <div className="mt-auto">
        <StepNav />
      </div>
    </>
  );
}
