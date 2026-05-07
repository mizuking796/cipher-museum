const { test, expect } = require('@playwright/test');

async function waitForApp(page) {
  await page.goto('./');
  await page.waitForSelector('.header-title', { timeout: 10000 });
  // Wait for sidebar to populate with cipher items
  await page.waitForFunction(
    () => document.querySelectorAll('.sidebar-item').length > 0,
    { timeout: 10000 }
  );
}

test.describe('Navigation', () => {
  test('sidebar shows all 20 cipher methods', async ({ page }) => {
    await waitForApp(page);
    const items = await page.locator('.sidebar-item').count();
    expect(items).toBe(20);
  });

  test('clicking a cipher loads its content', async ({ page }) => {
    await waitForApp(page);
    // Click the first cipher in sidebar
    await page.locator('.sidebar-item').first().click();
    await page.waitForTimeout(500);

    // Input area should be visible
    await expect(page.locator('#inputText, #input-text, textarea')).toBeVisible();
  });

  test('header logo returns to initial state', async ({ page }) => {
    await waitForApp(page);
    // Select a cipher
    await page.locator('.sidebar-item').first().click();
    await page.waitForTimeout(300);

    // Click header home
    await page.click('#headerHome, .header-home');
    await page.waitForTimeout(300);
  });
});

test.describe('Cipher Flow', () => {
  test('encrypt flow: input text → encrypt → output appears', async ({ page }) => {
    await waitForApp(page);
    // Select Caesar cipher (first substitution cipher)
    await page.locator('.sidebar-item').first().click();
    await page.waitForTimeout(500);

    // Type input text
    const input = page.locator('#inputText, #input-text, textarea').first();
    await input.fill('こんにちは');
    await page.waitForTimeout(300);

    // Click encrypt button
    const encryptBtn = page.locator('button:has-text("暗号化"), button:has-text("変換"), #btn-encrypt, #encryptBtn').first();
    await encryptBtn.click();
    await page.waitForTimeout(1000);

    // Output should have content
    const output = page.locator('#outputText, #output-text, .output-area').first();
    const text = await output.textContent();
    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe('Education Panel', () => {
  test('episode content loads for selected cipher', async ({ page }) => {
    await waitForApp(page);
    await page.locator('.sidebar-item').first().click();
    await page.waitForTimeout(500);

    // Education panel should have content
    const panel = page.locator('.episode-panel, .info-panel, aside').last();
    const content = await panel.textContent();
    expect(content.length).toBeGreaterThan(50);
  });
});
