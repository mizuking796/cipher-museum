const { test, expect } = require('@playwright/test');

async function waitForApp(page) {
  await page.goto('./');
  await page.waitForSelector('.header-title', { timeout: 10000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.sidebar-item').length > 0,
    { timeout: 10000 }
  );
}

test.describe('Visual Regression', () => {
  test('home page screenshot', async ({ page }) => {
    await waitForApp(page);
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
    });
  });

  test('caesar cipher active screenshot', async ({ page }) => {
    await waitForApp(page);
    await page.locator('.sidebar-item').first().click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('caesar-active.png', {
      fullPage: true,
    });
  });
});
