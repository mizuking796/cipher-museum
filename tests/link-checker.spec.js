const { test, expect } = require('@playwright/test');

test.describe('Link Checker', () => {
  test('all CSS and JS resources load successfully', async ({ page }) => {
    const failedResources = [];

    page.on('response', response => {
      const url = response.url();
      if ((url.endsWith('.css') || url.endsWith('.js') || url.includes('.css?') || url.includes('.js?'))
          && response.status() >= 400) {
        failedResources.push({ url, status: response.status() });
      }
    });

    await page.goto('./');
    await page.waitForSelector('.header-title', { timeout: 10000 });
    await page.waitForTimeout(2000);

    expect(failedResources, 'All CSS/JS resources should load').toEqual([]);
  });

  test('favicon loads', async ({ page }) => {
    const response = await page.request.get('./favicon.png');
    expect(response.status()).toBe(200);
  });

  test('font files load', async ({ page }) => {
    const fonts = ['fonts/aurebesh.woff2', 'fonts/sga.woff2'];
    for (const font of fonts) {
      const response = await page.request.get(`./${font}`);
      expect(response.status(), `${font} should load`).toBe(200);
    }
  });
});
