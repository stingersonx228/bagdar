/** ВЛАДЕЛЕЦ: лид. Корень ведёт на первую станцию маршрута. */
import { redirect } from 'next/navigation';
import { FIRST_FLOW_STEP } from '@/lib/flow';

export default function HomePage() {
  redirect(FIRST_FLOW_STEP.path);
}
