import { test, expect } from './fixtures';
import { solveLesson } from './solve';

test('группа открывает повторение и проходит три урока до шпаргалки', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('#/practice');
  await page.getByRole('link', { name: 'Части тела — сразу к повторению' }).click();
  await expect(page).toHaveURL(/#\/practice\/body$/);
  await expect(page.getByText('Слово 1 из 28')).toBeVisible();
  await expect(page.locator('article [lang="udm"]')).toHaveCount(0);
  const words = new Set<string>();
  for (let i = 0; i < 28; i++) {
    await page.getByRole('button', { name: 'Показать ответ' }).click();
    words.add(await page.locator('article [lang="udm"]').innerText());
    await page.getByRole('button', { name: i === 27 ? 'Завершить повторение' : 'Следующее слово' }).click();
  }
  expect(words.size).toBe(28);
  await page.getByRole('link', { name: 'Перейти к числительным' }).click();
  for (const id of ['u2-dates', 'u7-calendar', 'u11-survey']) {
    await expect(page).toHaveURL(new RegExp(id + '\\?class=1$'));
    await expect(page.getByTestId('lesson')).toBeVisible();
    await solveLesson(page);
    await page.getByTestId('finish').click();
  }
  await expect(page.getByRole('heading', { name: 'Шпаргалка для опроса' })).toBeVisible();
  await expect(page.getByText('Мынам вордскем нуналы куинетӥ толсуре.', {exact: true})).toBeVisible();
  await expect(page.getByText('Анна тужгес но гужемез яратэ.')).toBeVisible();
});

test('шпаргалка показывает группе сразу все даты и сезоны', async ({ page }) => {
  await page.goto('#/class/survey');
  const days = page.locator('[data-day]');
  const seasons = page.locator('[data-season]');
  await expect(days).toHaveCount(31);
  await expect(seasons).toHaveCount(4);
  await expect(seasons.locator('.month')).toHaveCount(12);
  await expect(page.locator('[data-day="1"]')).toContainText('нырысетӥ');
  await expect(page.locator('[data-day="11"]')).toContainText('дас одӥгетӥ');
  await expect(page.locator('[data-day="31"]')).toContainText('куамын одӥгетӥ');
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [[1280, 720], [1024, 768], [800, 600]]) {
    await page.setViewportSize({ width, height });
    const fits = await page.locator('[data-day], [data-season]').evaluateAll(nodes => nodes.every(node => {
      const { left, top, right, bottom } = node.getBoundingClientRect();
      return left >= 0 && right <= innerWidth && top >= 0 && bottom <= innerHeight;
    }));
    expect(fits).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('пройденный до обновления урок доступен после вставки нового', async ({ page }) => {
  await page.goto('#/');
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('udm.progress.v1') ?? '{}');
    d.lessons = { 'u10-l5': { done: 1, best: 1, last: Date.now() } };
    localStorage.setItem('udm.progress.v1', JSON.stringify(d));
  });
  await page.reload();
  await page.goto('#/lesson/u10-l5');
  await expect(page.getByTestId('lesson')).toBeVisible();
});
