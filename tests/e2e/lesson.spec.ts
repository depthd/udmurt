import { test, expect } from '@playwright/test';
import { solveLesson } from './solve';

test('новичок проходит первый урок с главной, получает XP и открывает второй урок', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('#/');
  await page.getByTestId('start-first').click();
  await expect(page.getByTestId('lesson')).toBeVisible();
  await solveLesson(page);
  await expect(page.getByTestId('lesson-end')).toBeVisible();
  await page.getByTestId('finish').click();
  // онбординг после первого урока
  if (await page.getByTestId('onboarding').isVisible().catch(() => false)) {
    await page.getByTestId('onboarding-name').fill('Алексей');
    await page.getByTestId('onboarding-next').click();
    await page.getByTestId('commit-7').click().catch(() => {});
    await page.getByTestId('commit-promise').click().catch(() => {});
  }
  await page.goto('#/learn');
  await expect(page.locator('[data-testid="node-u1-l2"]')).toBeVisible();
  await expect(page.locator('[data-testid="node-u1-l2"]')).not.toHaveAttribute('data-state', 'locked');
  const xp = await page.evaluate(() => JSON.parse(localStorage.getItem('udm.progress.v1') || '{}').xp);
  expect(xp).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('все уроки юнитов 1–3 проходятся до конца, ошибка возвращается в очередь', async ({ page }) => {
  test.setTimeout(1_200_000);
  await page.goto('#/');
  await page.evaluate(() => localStorage.setItem('udm.progress.v1', JSON.stringify({ v: 1, name: 'Алексей', xp: 1, onboarded: true })));
  for (const id of ['u1-l1', 'u1-l2', 'u1-l3', 'u1-l4', 'u1-l5', 'u1-l6', 'u1-story', 'u2-l1', 'u2-l2', 'u2-l3', 'u2-l4', 'u2-l5', 'u2-l6', 'u2-story', 'u3-l1', 'u3-l2', 'u3-l3', 'u3-l4', 'u3-l5', 'u3-story']) {
    await page.goto(`#/lesson/${id}`);
    await expect(page.getByTestId('lesson')).toBeVisible();
    const steps = await solveLesson(page, { wrongAt: id === 'u1-l3' ? 2 : undefined });
    expect(steps, id).toBeGreaterThan(3);
    await page.getByTestId('finish').click();
  }
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('udm.progress.v1') || '{}'));
  expect(Object.keys(p.lessons)).toHaveLength(20);
  expect(p.streak.current).toBe(1);
});
