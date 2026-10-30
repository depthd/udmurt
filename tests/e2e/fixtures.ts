/**
 * Общая страховка для всех e2e-тестов: тест падает, если на странице
 *   • браузер что-то заблокировал политикой безопасности (CSP) — значит, мы сломали её или код;
 *   • случилась необработанная ошибка JavaScript.
 * Импортируйте test и expect отсюда, а не из @playwright/test.
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          const w = window as unknown as { __csp?: string[] };
          (w.__csp ??= []).push(`${e.violatedDirective} ← ${e.blockedURI || 'inline'} (${e.sourceFile}:${e.lineNumber})`);
        });
      });
      page.on('pageerror', (e) => problems.push('pageerror: ' + String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) problems.push('csp: ' + m.text());
      });
      await use();
      const csp = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []).catch(() => []);
      expect([...problems, ...csp.map((c) => 'csp: ' + c)], 'ошибки или нарушения CSP на странице').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
