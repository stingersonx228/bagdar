/** ВЛАДЕЛЕЦ: зона B. Станция 2 — анкета: интересы, оценки, языки, экзамены, бюджет. */
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ProfileForm } from './ProfileForm';

export default function ProfilePage() {
  return (
    <>
      <ScreenHeader
        title="Анкета"
        lead="Ответы сохраняются на устройстве. Их можно поменять в любой момент — подборка пересчитается."
      />
      <ProfileForm />
    </>
  );
}
