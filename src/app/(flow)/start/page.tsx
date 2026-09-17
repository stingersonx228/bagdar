/** ВЛАДЕЛЕЦ: зона B. Станция 1 — вход в маршрут. */
import { MetroLine, type Station } from '@/components/ui/MetroLine';
import { StepNav } from '@/components/ui/StepNav';
import { FLOW_STEPS, type FlowStepId } from '@/lib/flow';

/**
 * Подписи живут здесь, а не в контракте flow: порядок станций общий для всех
 * зон, а формулировки — вопрос текста на экране, и менять их зона B должна
 * без правки общего файла.
 */
const SUMMARY: Record<FlowStepId, string> = {
  start: 'Смотрите, из чего состоит путь',
  profile: 'Отвечаете на вопросы о себе: оценки, языки, экзамены, бюджет',
  diagnosis: 'Видите, что уже работает на поступление, а что мешает',
  results: 'Получаете программы с объяснением, почему каждая здесь',
  compare: 'Ставите выбранное рядом и сравниваете строка к строке',
  roadmap: 'Забираете план до поступления и отмечаете выполненное',
};

export default function StartPage() {
  const stations: Station[] = FLOW_STEPS.map((step, index) => ({
    key: step.id,
    state: index === 0 ? 'current' : 'upcoming',
    content: (
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-ink">{step.label}</span>
        <span className="text-sm text-muted">{SUMMARY[step.id]}</span>
      </div>
    ),
  }));

  return (
    <>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Бағдар</h1>
        <p className="text-base text-muted">
          Маршрут поступления для 10–11 класса. Шесть станций: от анкеты до плана подготовки.
          Вы всегда видите, где находитесь и что дальше.
        </p>
      </header>

      <section aria-label="Из чего состоит маршрут" className="rounded-card bg-surface p-5 shadow-card">
        <MetroLine stations={stations} />
      </section>

      <p className="text-sm text-muted">
        Ответы хранятся только на вашем устройстве. Регистрации нет.
      </p>

      <div className="mt-auto">
        <StepNav label="Начать маршрут" />
      </div>
    </>
  );
}
