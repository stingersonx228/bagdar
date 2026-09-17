/** ВЛАДЕЛЕЦ: зона C. Станция 4 — рекомендации. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ResultsView } from './ResultsView';

export default function ResultsPage() {
  return (
    <>
      <ScreenHeader
        title="Рекомендации"
        lead="Программы подобраны движком под ваш профиль. Рядом с каждой — почему она здесь и что мешает."
      />
      <ResultsView />
    </>
  );
}
