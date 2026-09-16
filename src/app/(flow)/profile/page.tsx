/** ВЛАДЕЛЕЦ: зона B. Станция 2 — анкета: интересы, оценки, языки, экзамены, бюджет. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepNav } from '@/components/ui/StepNav';

export default function ProfilePage() {
  return (
    <>
      <ScreenHeader
        title="Анкета"
        lead="Здесь собирается профиль: класс, интересы, GPA, языки, экзамены, страны и бюджет. Ответы сохраняются на устройстве."
      />
      <div className="mt-auto">
        <StepNav />
      </div>
    </>
  );
}
