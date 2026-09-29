import { defineConfig } from '@playwright/test';

// Not 5173, so the suite never collides with a running dev server.
const port = 5174;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName,
    use: { browserName },
  })),
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
