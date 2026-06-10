import { defineConfig, devices } from '@playwright/test'

process.env.NO_PROXY = ['127.0.0.1', 'localhost', '::1'].join(',')
process.env.no_proxy = process.env.NO_PROXY

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite dev --host 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NO_PROXY: '127.0.0.1,localhost,::1',
      no_proxy: '127.0.0.1,localhost,::1',
      HEOS_ADMIN_EMAIL: 'admin@example.com',
      HEOS_ADMIN_PASSWORD_HASH:
        '61141f63191511414e4d71af2f5f446aa7fb3428a3fd74507cbc05e7dae70c3b',
      HEOS_SESSION_SECRET: 'playwright-local-session-secret',
    },
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
})
