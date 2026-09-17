/**
 * ВЛАДЕЛЕЦ: лид. Сквозной проход маршрута.
 * Тест ходит по кнопкам, а не по прямым URL, — так он ловит разрыв навигации
 * между станциями, ради которого и существует контракт @/lib/flow.
 */
import { expect, test } from '@playwright/test';

test('корень ведёт на первую станцию', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бағдар');
});

test('без анкеты экраны результата честно просят её заполнить', async ({ page }) => {
  await page.goto('/results');

  await expect(page.getByText('Сначала анкета')).toBeVisible();
  await page.getByRole('link', { name: 'Перейти к анкете' }).click();
  await expect(page).toHaveURL(/\/profile$/);
});

test('маршрут проходится от начала до плана подготовки', async ({ page }) => {
  await page.goto('/start');
  await page.getByRole('link', { name: 'Начать маршрут' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await page.getByRole('button', { name: 'Заполнить примером' }).click();
  await page.getByRole('button', { name: 'Показать рекомендации' }).click();

  // Диагностика считается из профиля, а не из заглушки.
  await expect(page).toHaveURL(/\/diagnosis$/);
  await expect(page.getByText('Цель маршрута')).toBeVisible();
  await page.getByRole('link', { name: /Дальше/ }).click();

  // Рекомендаций должно быть минимум три — это требование кейса.
  await expect(page).toHaveURL(/\/results$/);
  const compareBoxes = page.getByRole('checkbox', { name: 'В сравнение' });
  expect(await compareBoxes.count()).toBeGreaterThanOrEqual(3);

  await compareBoxes.nth(0).check();
  await compareBoxes.nth(1).check();
  await page.getByRole('link', { name: /Дальше/ }).click();

  // Сравнение показывает обе выбранные программы столбцами.
  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole('row', { name: /Стоимость в год/ })).toBeVisible();
  await page.getByRole('link', { name: /Дальше/ }).click();

  // План собран, и первый невыполненный шаг подписан как следующий.
  await expect(page).toHaveURL(/\/roadmap$/);
  // exact, иначе совпадает ещё и подпись «следующий шаг» на самом шаге.
  await expect(page.getByText('Следующий шаг', { exact: true })).toBeVisible();

  const steps = page.getByRole('checkbox');
  expect(await steps.count()).toBeGreaterThan(0);
  await expect(page.getByText(/^0 из \d+$/)).toBeVisible();

  await steps.first().check();
  await expect(page.getByText(/^1 из \d+$/)).toBeVisible();
});

test('ответы переживают перезагрузку страницы', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Заполнить примером' }).click();
  await page.getByRole('button', { name: 'Показать рекомендации' }).click();
  await expect(page).toHaveURL(/\/diagnosis$/);

  await page.reload();
  await expect(page.getByText('Цель маршрута')).toBeVisible();
});

test('пересказ от модели не может сломать экран рекомендаций', async ({ page }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Заполнить примером' }).click();
  await page.getByRole('button', { name: 'Показать рекомендации' }).click();
  await page.goto('/results');

  const cards = page.getByRole('checkbox', { name: 'В сравнение' });
  const before = await cards.count();

  await page.getByRole('button', { name: 'Объяснить простыми словами' }).click();

  // Ключа в CI нет, поэтому роут честно отвечает «недоступно». Тест не
  // проверяет, какая из двух веток сработала, — он проверяет главное: разбор
  // движка остаётся на месте в любом случае.
  await expect(page.getByRole('button', { name: 'Объяснить простыми словами' })).toBeHidden();
  expect(await cards.count()).toBe(before);
  await expect(cards.first()).toBeVisible();
});

async function fillSample(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Заполнить примером' }).click();
  await page.getByRole('button', { name: 'Показать рекомендации' }).click();
  await expect(page).toHaveURL(/\/diagnosis$/);
}

test('смена страны прямо на выдаче меняет список', async ({ page }) => {
  await fillSample(page);
  await page.goto('/results');

  const titles = page.getByRole('heading', { level: 2 });
  const before = await titles.allTextContents();
  expect(before.length).toBeGreaterThanOrEqual(3);

  // Это главный сценарий кейса: жюри меняет параметр и результат обязан
  // заметно измениться, причём без похода в анкету и обратно.
  await page.getByRole('button', { name: 'Чехия' }).click();

  await expect
    .poll(async () => (await titles.allTextContents()).join('|'))
    .not.toBe(before.join('|'));
});

test('сброс стирает ответы и возвращает на первую станцию', async ({ page }) => {
  await fillSample(page);
  await page.goto('/roadmap');

  await page.getByRole('button', { name: 'Начать заново' }).click();
  await page.getByRole('button', { name: 'Да, удалить и начать заново' }).click();

  await expect(page).toHaveURL(/\/start$/);

  // Профиля больше нет: экран результата снова зовёт в анкету.
  await page.goto('/results');
  await expect(page.getByText('Сначала анкета')).toBeVisible();
});
