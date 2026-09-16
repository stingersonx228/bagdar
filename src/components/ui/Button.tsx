/** ВЛАДЕЛЕЦ: зона B. Базовая кнопка и её классы (переиспользуются ссылками). */
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost';

const BASE =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-card px-5 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-line text-white hover:bg-line/90',
  ghost: 'border border-station bg-surface text-ink hover:bg-line-soft',
};

export function buttonClass(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...rest} />;
}
