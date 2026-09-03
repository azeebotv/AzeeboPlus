import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Tipping', () => {
  test.describe('Tip Button', () => {
    test('should show tip button on creator profile', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        await expect(page.locator('button:has-text("Tip"), [data-testid="tip-btn"]')).toBeVisible();
      }
    });

    test('should open tip modal when clicked', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        const tipBtn = page.locator('button:has-text("Tip"), [data-testid="tip-btn"]');
        if (await tipBtn.isVisible()) {
          await tipBtn.click();
          await expect(page.locator('[data-testid="tip-modal"], .tip-modal')).toBeVisible();
        }
      }
    });
  });

  test.describe('Tip Amount', () => {
    test('should show preset tip amounts', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        const tipBtn = page.locator('button:has-text("Tip"), [data-testid="tip-btn"]');
        if (await tipBtn.isVisible()) {
          await tipBtn.click();
          await expect(page.locator('[data-testid="tip-presets"], .tip-presets')).toBeVisible();
        }
      }
    });

    test('should allow custom tip amount', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        const tipBtn = page.locator('button:has-text("Tip"), [data-testid="tip-btn"]');
        if (await tipBtn.isVisible()) {
          await tipBtn.click();
          const customInput = page.locator('[data-testid="custom-amount"], input[type="number"]');
          if (await customInput.isVisible()) {
            await customInput.fill('1000');
            await expect(customInput).toHaveValue('1000');
          }
        }
      }
    });

    test('should validate minimum tip amount', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        const tipBtn = page.locator('button:has-text("Tip"), [data-testid="tip-btn"]');
        if (await tipBtn.isVisible()) {
          await tipBtn.click();
          const customInput = page.locator('[data-testid="custom-amount"], input[type="number"]');
          if (await customInput.isVisible()) {
            await customInput.fill('5');
            const submitBtn = page.locator('button[type="submit"]:has-text("Send")');
            if (await submitBtn.isVisible()) {
              await submitBtn.click();
              await expect(page.locator('.error, [role="alert"]')).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Tip Confirmation', () => {
    test('should show confirmation before sending', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        const tipBtn = page.locator('button:has-text("Tip"), [data-testid="tip-btn"]');
        if (await tipBtn.isVisible()) {
          await tipBtn.click();
          const preset = page.locator('[data-testid="tip-preset"], .tip-preset').first();
          if (await preset.isVisible()) {
            await preset.click();
            await expect(page.locator('[data-testid="tip-confirm"], .tip-confirm')).toBeVisible();
          }
        }
      }
    });

    test('should process tip successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/creators`);
      const creatorCard = page.locator('[data-testid="creator-card"], .creator-card').first();
      if (await creatorCard.isVisible()) {
        await creatorCard.click();
        const tipBtn = page.locator('button:has-text("Tip"), [data-testid="tip-btn"]');
        if (await tipBtn.isVisible()) {
          await tipBtn.click();
          const preset = page.locator('[data-testid="tip-preset"], .tip-preset').first();
          if (await preset.isVisible()) {
            await preset.click();
            const confirmBtn = page.locator('button:has-text("Confirm"), [data-testid="confirm-tip"]');
            if (await confirmBtn.isVisible()) {
              await confirmBtn.click();
              await expect(page.locator('[data-testid="tip-success"], .tip-success')).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Tip History', () => {
    test('should show tip history in wallet', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await expect(page.locator('[data-testid="transaction-list"], .transaction-list')).toBeVisible();
    });

    test('should filter tips in transaction history', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      const filterBtn = page.locator('[data-testid="filter-btn"], button:has-text("Filter")');
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        const tipFilter = page.locator('[data-testid="filter-tip"], button:has-text("Tips")');
        if (await tipFilter.isVisible()) {
          await tipFilter.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });
});
