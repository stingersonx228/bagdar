'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Быстрая подкрутка бюджета и стран прямо на выдаче.
 *
 * Первое, что сделает жюри, — поменяет бюджет и страну. Гонять их ради этого
 * в анкету и обратно значит прятать главное свойство продукта за тремя
 * переходами. Здесь те же поля профиля, только рядом со списком: подборка
 * пересчитывается на месте, потому что рекомендации — производные от профиля.
 */
import { MultiChoice, SingleChoice, type Choice } from '@/components/ui/Choice';
import { Card } from '@/components/ui/Field';
import { COUNTRY_LABELS, EXAM_LABELS, INTEREST_LABELS, formatKzt } from '@/engine';
import { useJourney } from '@/store/useJourney';
import type { Country, ExamId, ExamScore, Interest, Profile } from '@/types';

const INTEREST_CHOICES: readonly Choice<Interest>[] = (
  Object.keys(INTEREST_LABELS) as Interest[]
).map((value) => ({ value, label: INTEREST_LABELS[value] }));

const EXAM_CHOICES: readonly Choice<ExamId>[] = (Object.keys(EXAM_LABELS) as ExamId[]).map(
  (value) => ({ value, label: EXAM_LABELS[value] }),
);

const COUNTRY_CHOICES: readonly Choice<Country>[] = (
  Object.keys(COUNTRY_LABELS) as Country[]
).map((value) => ({ value, label: COUNTRY_LABELS[value] }));

const MAX_BUDGET = 10_000_000;

export function ResultsTuner({ profile }: { profile: Profile }) {
  const patchProfile = useJourney((state) => state.patchProfile);

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm font-medium text-ink">Покрутите параметры — список пересчитается</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="tuner-budget" className="text-sm text-muted">
          Бюджет:{' '}
          <span className="font-medium text-ink">
            {profile.budgetKztPerYear === 0
              ? 'только грант'
              : `до ${formatKzt(profile.budgetKztPerYear)} в год`}
          </span>
        </label>
        <input
          id="tuner-budget"
          type="range"
          min={0}
          max={MAX_BUDGET}
          step={100_000}
          value={Math.min(profile.budgetKztPerYear, MAX_BUDGET)}
          onChange={(event) => patchProfile({ budgetKztPerYear: Number(event.target.value) })}
          className="h-11 w-full accent-line"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Главный интерес</span>
        <SingleChoice
          label="Главный интерес"
          choices={INTEREST_CHOICES}
          value={profile.interests[0]}
          onChange={(interest) =>
            patchProfile({
              interests: [interest, ...profile.interests.filter((item) => item !== interest)].slice(0, 3),
            })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Экзамены</span>
        <MultiChoice
          label="Экзамены"
          choices={EXAM_CHOICES}
          value={profile.exams.map((exam) => exam.id)}
          onChange={(ids) => {
            // Новый экзамен добавляется без результата: выдумывать балл нельзя,
            // движок честно пометит его как «ещё не сдан».
            const exams: ExamScore[] = ids.map(
              (id) =>
                profile.exams.find((exam) => exam.id === id) ?? { id, score: null, plannedDate: null },
            );
            patchProfile({ exams });
          }}
        />
        {profile.exams.map((exam) => (
          <label key={exam.id} className="flex items-center justify-between gap-3 text-sm text-muted">
            <span>Балл {EXAM_LABELS[exam.id]}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={exam.score ?? ''}
              placeholder="нет"
              aria-label={`Балл ${EXAM_LABELS[exam.id]}`}
              onChange={(event) => {
                const raw = event.target.value;
                const score = raw === '' ? null : Number(raw);
                if (score !== null && !Number.isFinite(score)) return;
                patchProfile({
                  exams: profile.exams.map((item) => (item.id === exam.id ? { ...item, score } : item)),
                });
              }}
              className="h-11 w-24 rounded-lg border border-hairline bg-surface px-3 text-right text-ink"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Страны</span>
        <MultiChoice
          label="Страны"
          choices={COUNTRY_CHOICES}
          value={profile.countries}
          onChange={(countries) => {
            // Последнюю страну снять нельзя: пустой список стран означает
            // пустую выдачу, и экран превратился бы в тупик.
            if (countries.length === 0) return;
            patchProfile({ countries });
          }}
        />
      </div>
    </Card>
  );
}
