import { test, expect } from './fixtures';
import { solveCurrent, solveLesson } from './solve';
import { loadCourse } from '../../vite/load-content.ts';

// Все уроки курса по порядку — список берётся из content/, чтобы новые юниты проверялись сами.
const ALL = loadCourse('content').units.flatMap((u) => u.lessons.map((l) => l.id));
// E2E_FROM=u7-l1 — начать с этого урока (предыдущие считаются пройденными); удобно для новых юнитов.
const FROM = Math.max(0, ALL.indexOf(process.env.E2E_FROM ?? ''));
const SEED = Object.fromEntries(ALL.slice(0, FROM).map((id) => [id, { done: 1, best: 1 }]));

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

test('урок, заданный в группе, открывается вне очереди — по ссылке и с пути', async ({ page }) => {
  const [late, other, afterLate] = [ALL[12], ALL[20], ALL[13]];
  await page.goto(`#/lesson/${late}`);
  await expect(page.getByTestId('lesson-locked')).toBeVisible();
  await page.getByTestId('open-anyway').click();
  await expect(page.getByTestId('lesson')).toBeVisible();
  // на пути: этот урок теперь открыт, следующий за ним — ещё нет
  await page.goto('#/learn');
  await expect(page.getByTestId(`node-${late}`)).toHaveAttribute('data-state', 'current');
  await expect(page.getByTestId(`node-${afterLate}`)).toHaveAttribute('data-state', 'locked');
  // закрытый узел на пути → «Открыть сейчас»
  await page.getByTestId(`node-${other}`).click();
  await expect(page.getByTestId('locked-hint')).toBeVisible();
  await page.getByTestId('open-anyway').click();
  await expect(page.getByTestId('lesson')).toBeVisible();
  const opened = await page.evaluate(() => JSON.parse(localStorage.getItem('udm.progress.v1') || '{}').opened);
  expect(opened).toEqual([late, other]);
});

test('об ошибке в задании можно сообщить и без GitHub — текст копируется', async ({ page, context, baseURL }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin });
  await page.goto('#/lesson/u1-l1');
  await expect(page.getByTestId('lesson')).toBeVisible();
  // идём по уроку до первого вопроса с вариантами и отвечаем неверно
  for (let i = 0; i < 30; i++) {
    const wrong = page.locator('[data-testid^="option-"]:not([data-correct])').first();
    if (await wrong.isVisible().catch(() => false)) {
      await wrong.click();
      await page.getByTestId('check').click();
      break;
    }
    await solveCurrent(page);
  }
  const fb = page.getByTestId('feedback');
  await expect(fb).toHaveAttribute('data-kind', 'wrong');
  await expect(fb.getByRole('link', { name: /Сообщить об ошибке/ })).toHaveAttribute('href', /^https:\/\/github\.com\/depthd\/udmurt\/issues\/new\?/);
  await page.getByTestId('copy-report').click();
  await expect(page.getByTestId('copy-report')).toHaveText('текст скопирован');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Ошибка в задании: u1-l1');
  expect(text).toContain('Правильный ответ на сайте:');
  expect(text).not.toContain('**');
});

test('все уроки курса проходятся до конца, ошибка возвращается в очередь', async ({ page }) => {
  test.setTimeout(1_800_000);
  await page.goto('#/');
  await page.evaluate((seed) => localStorage.setItem('udm.progress.v1', JSON.stringify({ v: 1, name: 'Алексей', xp: 1, onboarded: true, lessons: seed })), SEED);
  await page.reload();
  for (const id of ALL.slice(FROM)) {
    await page.goto(`#/lesson/${id}`);
    await expect(page.getByTestId('lesson')).toBeVisible();
    const steps = await solveLesson(page, { wrongAt: id === 'u1-l3' ? 2 : undefined });
    expect(steps, id).toBeGreaterThan(3);
    await page.getByTestId('finish').click();
  }
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('udm.progress.v1') || '{}'));
  expect(Object.keys(p.lessons)).toHaveLength(ALL.length);
  expect(p.streak.current).toBe(1);
});
