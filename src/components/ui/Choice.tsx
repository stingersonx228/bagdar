'use client';

/**
 * ВЛАДЕЛЕЦ: зона B. Выбор «чипами».
 *
 * Два компонента вместо одного с режимом: одиночный выбор возвращает значение,
 * множественный — массив, и смешивать их в одном типе значит врать вызывающему.
 */

export interface Choice<T extends string> {
  value: T;
  label: string;
}

const CHIP =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line';
const CHIP_ON = 'border-line bg-line text-white';
const CHIP_OFF = 'border-hairline bg-surface text-ink hover:border-line';

export function SingleChoice<T extends string>({
  choices,
  value,
  onChange,
  label,
}: {
  choices: readonly Choice<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {choices.map((choice) => {
        const active = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(choice.value)}
            className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

export function MultiChoice<T extends string>({
  choices,
  value,
  onChange,
  label,
  max,
  ordered = false,
}: {
  choices: readonly Choice<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  label: string;
  /** Больше max выбрать нельзя — остальные чипы гаснут. */
  max?: number;
  /** Показывать порядковый номер: для интересов порядок = приоритет. */
  ordered?: boolean;
}) {
  const atLimit = max !== undefined && value.length >= max;

  function toggle(item: T) {
    if (value.includes(item)) {
      onChange(value.filter((current) => current !== item));
      return;
    }
    if (atLimit) return;
    onChange([...value, item]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {choices.map((choice) => {
        const index = value.indexOf(choice.value);
        const active = index !== -1;
        const blocked = !active && atLimit;

        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={active}
            disabled={blocked}
            onClick={() => toggle(choice.value)}
            className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF} ${blocked ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {ordered && active ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-xs font-semibold">
                {index + 1}
              </span>
            ) : null}
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
