'use client';

/**
 * ВЛАДЕЛЕЦ: зона B. Анкета — вторая станция маршрута.
 *
 * Черновик держим в локальном состоянии и пишем в стор одним setProfile при
 * отправке: иначе в сторе окажется наполовину заполненный профиль, и движок
 * начнёт считать рекомендации по мусору.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Field } from '@/components/ui/Field';
import { MultiChoice, SingleChoice, type Choice } from '@/components/ui/Choice';
import { buttonClass } from '@/components/ui/Button';
import { citiesOfCountry } from '@/data';
import { SAMPLE_PROFILE } from '@/data/sampleProfile';
import {
  COUNTRY_LABELS,
  ENGLISH_LABELS,
  EXAM_LABELS,
  INTEREST_LABELS,
  formatGpa,
  formatKzt,
} from '@/engine';
import { nextFlowStep } from '@/lib/flow';
import { useJourney } from '@/store/useJourney';
import type { Country, ExamId, Interest, Profile } from '@/types';

type EnglishLevel = Profile['languages']['en'];
type Priority = Profile['priorities'][number];

const EMPTY_DRAFT: Profile = {
  grade: 11,
  interests: [],
  gpa: 4,
  languages: { kz: false, ru: true, en: 'basic' },
  exams: [],
  countries: [],
  preferredCities: [],
  budgetKztPerYear: 1_500_000,
  needsGrant: true,
  priorities: [],
};

const GRADE_CHOICES: readonly Choice<'10' | '11'>[] = [
  { value: '10', label: '10 класс' },
  { value: '11', label: '11 класс' },
];

const INTEREST_CHOICES: readonly Choice<Interest>[] = (
  Object.keys(INTEREST_LABELS) as Interest[]
).map((value) => ({ value, label: INTEREST_LABELS[value] }));

const COUNTRY_CHOICES: readonly Choice<Country>[] = (
  Object.keys(COUNTRY_LABELS) as Country[]
).map((value) => ({ value, label: COUNTRY_LABELS[value] }));

const EXAM_CHOICES: readonly Choice<ExamId>[] = (Object.keys(EXAM_LABELS) as ExamId[]).map(
  (value) => ({ value, label: EXAM_LABELS[value] }),
);

const ENGLISH_CHOICES: readonly Choice<EnglishLevel>[] = (
  Object.keys(ENGLISH_LABELS) as EnglishLevel[]
).map((value) => ({ value, label: ENGLISH_LABELS[value] }));

const PRIORITY_CHOICES: readonly Choice<Priority>[] = [
  { value: 'cost', label: 'Стоимость' },
  { value: 'prestige', label: 'Престиж' },
  { value: 'city', label: 'Город' },
  { value: 'career', label: 'Карьера' },
  { value: 'language', label: 'Язык обучения' },
];

const MAX_BUDGET = 8_000_000;

export function ProfileForm() {
  const hydrated = useJourney((state) => state.hydrated);

  // Ждём регидратации и только потом монтируем форму. Так черновик берёт
  // сохранённый профиль прямо в useState, без эффекта, который сначала показал
  // бы пустую анкету и тут же перезаписал её.
  if (!hydrated) {
    return (
      <Card>
        <p className="text-sm text-muted">Загружаем ваши ответы…</p>
      </Card>
    );
  }

  return <ProfileFormFields />;
}

function ProfileFormFields() {
  const router = useRouter();
  const saved = useJourney((state) => state.profile);
  const setProfile = useJourney((state) => state.setProfile);

  const [draft, setDraft] = useState<Profile>(saved ?? EMPTY_DRAFT);
  const [showErrors, setShowErrors] = useState(false);

  const cityChoices = useMemo<readonly Choice<string>[]>(() => {
    const cities = draft.countries.flatMap((country) => citiesOfCountry(country));
    return [...new Set(cities)].map((city) => ({ value: city, label: city }));
  }, [draft.countries]);

  const interestsError =
    draft.interests.length === 0 ? 'Выберите хотя бы одно направление' : null;
  const countriesError = draft.countries.length === 0 ? 'Выберите хотя бы одну страну' : null;
  const valid = interestsError === null && countriesError === null;

  function patch(part: Partial<Profile>) {
    setDraft((current) => ({ ...current, ...part }));
  }

  function setCountries(countries: Country[]) {
    // Город из выброшенной страны тянуть за собой нельзя.
    const allowed = new Set(countries.flatMap((country) => citiesOfCountry(country)));
    patch({
      countries,
      preferredCities: draft.preferredCities.filter((city) => allowed.has(city)),
    });
  }

  function setExams(ids: ExamId[]) {
    patch({
      exams: ids.map(
        (id) => draft.exams.find((exam) => exam.id === id) ?? { id, score: null, plannedDate: null },
      ),
    });
  }

  function patchExam(id: ExamId, part: Partial<Profile['exams'][number]>) {
    patch({
      exams: draft.exams.map((exam) => (exam.id === id ? { ...exam, ...part } : exam)),
    });
  }

  function submit() {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setProfile(draft);
    const next = nextFlowStep('/profile');
    router.push(next ? next.path : '/diagnosis');
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3 bg-line-soft">
        <p className="text-sm text-ink">
          Нет времени заполнять? Подставим готовый профиль — потом можно поменять любой ответ.
        </p>
        <button
          type="button"
          onClick={() => setDraft(SAMPLE_PROFILE)}
          className={buttonClass('ghost')}
        >
          Заполнить примером
        </button>
      </Card>

      <Field label="Класс">
        <SingleChoice
          label="Класс"
          choices={GRADE_CHOICES}
          value={draft.grade === 10 ? '10' : '11'}
          onChange={(next) => patch({ grade: next === '10' ? 10 : 11 })}
        />
      </Field>

      <Field
        label="Направления"
        hint="До трёх. Порядок важен: первое считается главным."
        error={showErrors ? interestsError : null}
      >
        <MultiChoice
          label="Направления"
          choices={INTEREST_CHOICES}
          value={draft.interests}
          onChange={(interests) => patch({ interests })}
          max={3}
          ordered
        />
      </Field>

      <Field label="Средний балл аттестата" hint={`Сейчас: ${formatGpa(draft.gpa)}`}>
        <input
          type="range"
          min={2}
          max={5}
          step={0.1}
          value={draft.gpa}
          onChange={(event) => patch({ gpa: Number(event.target.value) })}
          className="h-11 w-full accent-line"
          aria-label="Средний балл аттестата"
        />
      </Field>

      <Field label="Языки">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-11 items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 text-sm">
              <input
                type="checkbox"
                checked={draft.languages.kz}
                onChange={(event) =>
                  patch({ languages: { ...draft.languages, kz: event.target.checked } })
                }
                className="size-4 accent-line"
              />
              Казахский
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 text-sm">
              <input
                type="checkbox"
                checked={draft.languages.ru}
                onChange={(event) =>
                  patch({ languages: { ...draft.languages, ru: event.target.checked } })
                }
                className="size-4 accent-line"
              />
              Русский
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">Английский</span>
            <SingleChoice
              label="Уровень английского"
              choices={ENGLISH_CHOICES}
              value={draft.languages.en}
              onChange={(en) => patch({ languages: { ...draft.languages, en } })}
            />
          </div>
        </div>
      </Field>

      <Field label="Экзамены" hint="Отметьте сданные и запланированные. Балл можно не указывать.">
        <div className="flex flex-col gap-3">
          <MultiChoice
            label="Экзамены"
            choices={EXAM_CHOICES}
            value={draft.exams.map((exam) => exam.id)}
            onChange={setExams}
          />
          {draft.exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{EXAM_LABELS[exam.id]}</span>
              <label className="flex items-center gap-2 text-sm text-muted">
                Балл
                <input
                  type="number"
                  inputMode="decimal"
                  value={exam.score ?? ''}
                  placeholder="ещё не сдан"
                  onChange={(event) =>
                    patchExam(exam.id, {
                      score: event.target.value === '' ? null : Number(event.target.value),
                    })
                  }
                  className="min-h-11 w-32 rounded-lg border border-hairline px-3 text-ink"
                />
              </label>
              {exam.score === null ? (
                <label className="flex items-center gap-2 text-sm text-muted">
                  Дата
                  <input
                    type="date"
                    value={exam.plannedDate ?? ''}
                    onChange={(event) =>
                      patchExam(exam.id, {
                        plannedDate: event.target.value === '' ? null : event.target.value,
                      })
                    }
                    className="min-h-11 rounded-lg border border-hairline px-3 text-ink"
                  />
                </label>
              ) : null}
            </Card>
          ))}
        </div>
      </Field>

      <Field label="Страны" error={showErrors ? countriesError : null}>
        <MultiChoice
          label="Страны"
          choices={COUNTRY_CHOICES}
          value={draft.countries}
          onChange={setCountries}
        />
      </Field>

      {cityChoices.length > 0 ? (
        <Field label="Города" hint="Не фильтр: программы других городов останутся в списке, но ниже.">
          <MultiChoice
            label="Города"
            choices={cityChoices}
            value={draft.preferredCities}
            onChange={(preferredCities) => patch({ preferredCities })}
          />
        </Field>
      ) : null}

      <Field
        label="Бюджет на год"
        hint={
          draft.budgetKztPerYear === 0
            ? 'Только грант — платные программы отпадут'
            : `До ${formatKzt(draft.budgetKztPerYear)} в год`
        }
      >
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min={0}
            max={MAX_BUDGET}
            step={100_000}
            value={draft.budgetKztPerYear}
            onChange={(event) => patch({ budgetKztPerYear: Number(event.target.value) })}
            className="h-11 w-full accent-line"
            aria-label="Бюджет на год"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.needsGrant}
              onChange={(event) => patch({ needsGrant: event.target.checked })}
              className="size-4 accent-line"
            />
            Рассчитываю на грант
          </label>
        </div>
      </Field>

      <Field label="Что важнее всего" hint="Влияет на порядок программ в подборке.">
        <MultiChoice
          label="Приоритеты"
          choices={PRIORITY_CHOICES}
          value={draft.priorities}
          onChange={(priorities) => patch({ priorities })}
        />
      </Field>

      {showErrors && !valid ? (
        <p role="alert" className="text-sm font-medium text-danger">
          Заполните направления и страны — без них подбор невозможен.
        </p>
      ) : null}

      <button type="button" onClick={submit} className={buttonClass('primary')}>
        Показать рекомендации
      </button>
    </div>
  );
}
