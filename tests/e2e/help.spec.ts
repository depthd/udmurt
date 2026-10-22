import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// Фальшивый микрофон Chromium: синусоида вместо голоса, без запроса разрешения.
const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
test.use({
  launchOptions: { executablePath: exe, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['microphone'],
});

test('помочь проекту: проверка, запись голосом, архив и импорт', async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('#/help');
  await page.getByPlaceholder('Имя и фамилия').fill('Тест Тестов');
  await page.getByRole('checkbox', { name: /CC BY 4.0/ }).check();

  const items = page.getByTestId('help-item');
  await items.nth(0).getByTestId('mark-ok').click();
  await items.nth(1).getByTestId('mark-bad').click();
  await items.nth(1).locator('textarea').fill('проверка');
  await items.nth(1).getByTestId('save-fix').click();
  await expect(page.getByRole('status').filter({ hasText: 'Проверено' })).toContainText('Проверено 2');

  const rec = items.nth(2).getByTestId('rec');
  await rec.click();
  await page.waitForTimeout(1500);
  await rec.click();
  await expect(items.nth(2).getByRole('button', { name: 'Прослушать мою запись' })).toBeVisible();

  // запись переживает перезагрузку (IndexedDB)
  await page.reload();
  await expect(page.getByTestId('help-item').nth(2).getByRole('button', { name: 'Прослушать мою запись' })).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-zip').click()]);
  const file = info.outputPath('help.zip');
  await dl.saveAs(file);
  expect(fs.statSync(file).size).toBeGreaterThan(1000);
  const list = execFileSync('python3', ['-I', '-c', 'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print("\\n".join(z.namelist()))', file], { encoding: 'utf8' });
  expect(list).toContain('review.md');
  expect(list).toMatch(/audio\/[\w-]+\.(webm|ogg|m4a)/);
  const imp = execFileSync('python3', ['-I', 'scripts/tts/import_native.py', file, '--dry-run'], { encoding: 'utf8' });
  expect(imp).toContain('Тест Тестов');
  expect(imp).toContain('[dry-run]');
  expect(errors).toEqual([]);
});
