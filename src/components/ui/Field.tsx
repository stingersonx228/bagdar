/** ВЛАДЕЛЕЦ: зона B. Секция анкеты: заголовок, подсказка, ошибка. */
import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend className="flex flex-col gap-1 p-0">
        <span className="text-base font-medium text-ink">{label}</span>
        {hint ? <span className="text-sm text-muted">{hint}</span> : null}
      </legend>
      {children}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-hairline bg-surface p-4 ${className}`.trim()}>
      {children}
    </div>
  );
}
