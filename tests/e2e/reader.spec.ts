import { test, expect } from '@playwright/test';
import { loadCourse } from '../../vite/load-content.ts';

const course = loadCourse('content');

test('читалка: значение слова, вопросы, XP за текст', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const t = course.texts[0];
  await page.goto('#/read');
  await page.getByTestId(`text-${t.id}`).click();
  await expect(page.getByTestId('reader')).toBeVisible();
  // слово «Мон» есть в любом тексте про себя — значение из словника курса
  await page.getByTestId('word').first().click();
  await expect(page.getByTestId('gloss')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('gloss')).toBeHidden();
  await page.getByTestId('toggle-ru').click();
  for (const [i, q] of t.questions.entries()) await page.getByTestId(`q${i}-opt`).filter({ hasText: q.answer }).click();
  await page.getByTestId('reader-finish').click();
  await expect(page.getByTestId('reader-done')).toContainText('XP');
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('udm.progress.v1') || '{}'));
  expect(p.read[t.id]).toBe(1);
  expect(p.xp).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('читалка: каждое слово каждого текста даёт значение', async ({ page }) => {
  test.setTimeout(300_000);
  for (const t of course.texts) {
    await page.goto(`#/read/${t.id}`);
    await expect(page.getByTestId('reader')).toHaveAttribute('data-text', t.id);
    const words = page.getByTestId('word');
    const n = await words.count();
    for (let i = 0; i < n; i++) {
      await words.nth(i).click();
      const g = page.getByTestId('gloss');
      await expect(g).toBeVisible();
      await expect(g).not.toContainText('Ищу в словаре', { timeout: 15_000 });
      await page.keyboard.press('Escape');
    }
  }
});

test('разговорник: поиск и шпаргалки с таблицами', async ({ page }) => {
  await page.goto('#/phrases');
  await page.getByRole('searchbox').fill('кытын');
  await expect(page.getByText('Кытын почта?')).toBeVisible();
  await page.getByTestId('tab-guides').click();
  await expect(page.locator('.md table').first()).toBeVisible();
});
