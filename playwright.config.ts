import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

const exe = process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173/udmurt/',
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: exe },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'VITE_E2E=1 npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173/udmurt/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
