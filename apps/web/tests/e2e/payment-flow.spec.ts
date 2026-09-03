import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Payment Flow', () => {
  test.describe('Wallet', () => {
    test('should display wallet balance', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await expect(page.locator('[data-testid="wallet-balance"], .wallet-balance')).toBeVisible();
    });

    test('should display transaction history', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await expect(page.locator('[data-testid="transaction-list"], .transaction-list')).toBeVisible();
    });

    test('should show fund wallet button', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await expect(page.locator('button:has-text("Fund"), button:has-text("Add Money")')).toBeVisible();
    });
  });

  test.describe('Funding', () => {
    test('should open fund wallet modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await page.click('button:has-text("Fund"), button:has-text("Add Money")');
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
    });

    test('should validate minimum amount', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await page.click('button:has-text("Fund"), button:has-text("Add Money")');
      await page.fill('input[type="number"], input[name="amount"]', '50');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error, [role="alert"]')).toContainText(/minimum/i);
    });

    test('should validate maximum amount', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await page.click('button:has-text("Fund"), button:has-text("Add Money")');
      await page.fill('input[type="number"], input[name="amount"]', '10000000');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error, [role="alert"]')).toContainText(/maximum/i);
    });

    test('should show payment method selection', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await page.click('button:has-text("Fund"), button:has-text("Add Money")');
      await expect(page.locator('[data-testid="payment-methods"], .payment-methods')).toBeVisible();
    });
  });

  test.describe('Subscriptions', () => {
    test('should display subscription plans', async ({ page }) => {
      await page.goto(`${BASE_URL}/subscriptions`);
      await expect(page.locator('[data-testid="subscription-plans"], .subscription-plans')).toBeVisible();
    });

    test('should show plan comparison', async ({ page }) => {
      await page.goto(`${BASE_URL}/subscriptions`);
      await expect(page.locator('.plan-card, [data-testid="plan-card"]').first()).toBeVisible();
    });

    test('should show pricing details', async ({ page }) => {
      await page.goto(`${BASE_URL}/subscriptions`);
      await expect(page.locator('.price, [data-testid="price"]').first()).toBeVisible();
    });
  });

  test.describe('Transactions', () => {
    test('should filter transactions by type', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await page.click('[data-testid="filter-button"], button:has-text("Filter")');
      await page.click('[data-testid="filter-credit"], button:has-text("Credit")');
      await expect(page.locator('.transaction-item, [data-testid="transaction"]').first()).toBeVisible();
    });

    test('should paginate transactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/wallet`);
      await expect(page.locator('[data-testid="pagination"], .pagination')).toBeVisible();
    });
  });
});
