import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Creator Flow', () => {
  test.describe('Creator Dashboard', () => {
    test('should display creator dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator`);
      await expect(page.locator('[data-testid="creator-dashboard"], .creator-dashboard')).toBeVisible();
    });

    test('should show analytics overview', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator`);
      await expect(page.locator('[data-testid="analytics-overview"], .analytics-overview')).toBeVisible();
    });

    test('should show earnings summary', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator`);
      await expect(page.locator('[data-testid="earnings"], .earnings')).toBeVisible();
    });
  });

  test.describe('Content Management', () => {
    test('should display content list', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/content`);
      await expect(page.locator('[data-testid="content-list"], .content-list')).toBeVisible();
    });

    test('should show upload button', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/content`);
      await expect(page.locator('button:has-text("Upload"), button:has-text("Add Content")')).toBeVisible();
    });

    test('should open upload modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/content`);
      await page.click('button:has-text("Upload"), button:has-text("Add Content")');
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/content`);
      await page.click('button:has-text("Upload"), button:has-text("Add Content")');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error, [role="alert"]').first()).toBeVisible();
    });
  });

  test.describe('Earnings', () => {
    test('should display earnings page', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/earnings`);
      await expect(page.locator('[data-testid="earnings-page"], .earnings-page')).toBeVisible();
    });

    test('should show earnings chart', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/earnings`);
      await expect(page.locator('[data-testid="earnings-chart"], .earnings-chart')).toBeVisible();
    });

    test('should show withdrawal button', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/earnings`);
      await expect(page.locator('button:has-text("Withdraw"), button:has-text("Payout")')).toBeVisible();
    });
  });

  test.describe('Channel', () => {
    test('should display channel page', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/channel`);
      await expect(page.locator('[data-testid="channel-page"], .channel-page')).toBeVisible();
    });

    test('should show subscriber count', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/channel`);
      await expect(page.locator('[data-testid="subscriber-count"], .subscriber-count')).toBeVisible();
    });

    test('should allow channel settings edit', async ({ page }) => {
      await page.goto(`${BASE_URL}/creator/channel`);
      await page.click('button:has-text("Edit"), button:has-text("Settings")');
      await expect(page.locator('.modal, [role="dialog"], form')).toBeVisible();
    });
  });
});
