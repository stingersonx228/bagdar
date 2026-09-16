/** ВЛАДЕЛЕЦ: лид. Корневой layout и метаданные. */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Бағдар — персональный маршрут поступления',
  description:
    'Маршрут поступления для учеников 10–11 класса: анкета, диагностика, подобранные программы, сравнение и пошаговый план.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
