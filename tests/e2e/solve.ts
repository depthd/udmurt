/** Автопрохождение урока для e2e: решает текущее задание по подсказкам data-* (только в сборке VITE_E2E=1). */
import { expect, type Page } from '@playwright/test';

const vis = (page: Page, sel: string) => page.locator(sel).first().isVisible().catch(() => false);

export async function solveCurrent(page: Page, opts: { wrong?: boolean } = {}): Promise<'done' | 'step'> {
  if (await vis(page, '[data-testid="lesson-end"]')) return 'done';

  if (await vis(page, '[data-testid="teach-card"]')) {
    await page.getByTestId('continue').click();
    return 'step';
  }
  if (await vis(page, '[data-testid^="match-udm-"]')) {
    const left = page.locator('[data-testid^="match-udm-"]');
    const n = await left.count();
    for (let i = 0; i < n; i++) {
      const l = left.nth(i);
      if (await l.isDisabled()) continue;
      const pair = await l.getAttribute('data-pair');
      await l.click();
      await page.locator(`[data-testid^="match-ru-"][data-pair="${pair}"]`).click();
    }
    await page.getByTestId('continue').click();
    return 'step';
  }
  const orderedBank = page.locator('[data-testid^="bank-"][data-order], [data-testid^="morph-"][data-order]');
  if (await orderedBank.first().isVisible().catch(() => false)) {
    const n = await orderedBank.count();
    for (let k = 0; k < n; k++) await page.locator(`[data-order="${k}"]`).first().click();
    if (opts.wrong) {
      // испортить ответ: убрать последнюю плитку
      await page.locator('[data-testid^="answer-"]').last().click().catch(() => {});
    }
  } else if (await vis(page, '[data-testid="answer-input"]')) {
    const input = page.getByTestId('answer-input');
    const expected = (await input.getAttribute('data-expected')) ?? '';
    await input.fill(opts.wrong ? 'неправильно' : expected);
  } else {
    const sel = opts.wrong
      ? '[data-testid^="option-"]:not([data-correct]), [data-testid^="fill-option-"]:not([data-correct]), [data-testid^="dialogue-option-"]:not([data-correct])'
      : '[data-testid^="option-"][data-correct], [data-testid^="fill-option-"][data-correct], [data-testid^="dialogue-option-"][data-correct]';
    const opt = page.locator(sel).first();
    await expect(opt).toBeVisible({ timeout: 8000 });
    await opt.click();
  }
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toBeVisible();
  await page.getByTestId('continue').click();
  return 'step';
}

export async function solveLesson(page: Page, opts: { wrongAt?: number } = {}) {
  for (let step = 0; step < 80; step++) {
    const r = await solveCurrent(page, { wrong: step === opts.wrongAt });
    if (r === 'done') return step;
    await page.waitForTimeout(120);
  }
  throw new Error('урок не закончился за 80 шагов');
}
