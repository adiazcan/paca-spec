import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const appRoot = fileURLToPath(new URL('../../', import.meta.url))

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.smoke.spec.ts',
  timeout: 30_000,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    cwd: appRoot,
    env: {
      ...process.env,
      VITE_APP_DATA_MODE: 'mock',
    },
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
