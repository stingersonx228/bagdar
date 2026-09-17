'use client';

/**
 * ВЛАДЕЛЕЦ: зона C. Быстрая подкрутка бюджета и стран прямо на выдаче.
 *
 * Первое, что сделает жюри, — поменяет бюджет и страну. Гонять их ради этого
 * в анкету и обратно значит прятать главное свойство продукта за тремя
 * переходами. Здесь те же поля профиля, только рядом со списком: подборка
 * пересчитывается на месте, потому что рекомендации — производные от профиля.
 */
import { MultiChoice, type Choice } from '@/components/ui/Choice';
import { Card } from '@/components/ui/Field';
import { COUNTRY_LABELS, formatKzt } from '@/engine';
import { useJourney } from '@/store/useJourney';
import type { Country, Profile } from '@/types';

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
