/**
 * ВЛАДЕЛЕЦ: лид. Сквозной проход маршрута.
 * Тест ходит по кнопкам, а не по прямым URL, — так он ловит разрыв навигации
 * между станциями, ради которого и существует контракт @/lib/flow.
 */
import { expect, test } from '@playwright/test';

const STATIONS = [
  { heading: 'Бағдар', path: '/start' },
  { heading: 'Анкета', path: '/profile' },
  { heading: 'Диагностика', path: '/diagnosis' },
  { heading: 'Рекомендации', path: '/results' },
  { heading: 'Сравнение', path: '/compare' },
  { heading: 'Маршрут', path: '/roadmap' },
] as const;

test('корень ведёт на первую станцию', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бағдар');
});

test('маршрут проходится кнопками от начала до конца', async ({ page }) => {
  await page.goto('/start');

  for (const [index, station] of STATIONS.entries()) {
    await expect(page).toHaveURL(new RegExp(`${station.path}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(station.heading);
    await expect(page.getByText(`Станция ${index + 1} из ${STATIONS.length}`)).toBeVisible();

    const isLast = index === STATIONS.length - 1;
    if (!isLast) {
      await page.getByRole('link', { name: /Начать маршрут|Дальше/ }).click();
    }
  }

  // На последней станции кнопка возвращает в начало маршрута.
  await page.getByRole('link', { name: 'Пройти маршрут заново' }).click();
  await expect(page).toHaveURL(/\/start$/);
});
