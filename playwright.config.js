const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'https://mizuking796.github.io/cipher-museum/',
    headless: true,
    screenshot: 'only-on-failure',
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
