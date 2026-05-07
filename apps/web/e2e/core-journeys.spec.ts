import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('user can register and login', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
  });

  test('shows error for invalid login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

test.describe('Content Watch Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can browse and watch content', async ({ page }) => {
    await page.goto('/browse');

    await expect(page.locator('text=Trending')).toBeVisible();

    await page.click('[data-testid="content-card"]:first-child');

    await expect(page).toHaveURL(/\/watch\/.+/);
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
  });

  test('premium content requires subscription', async ({ page }) => {
    await page.goto('/watch/premium-content-id');

    await expect(page.locator('text=Subscribe to watch')).toBeVisible();
  });
});

test.describe('Wallet Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can fund wallet', async ({ page }) => {
    await page.goto('/wallet');

    await page.click('text=Fund Wallet');

    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="method"]', 'card');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Payment initiated')).toBeVisible();
  });

  test('shows correct balance after funding', async ({ page }) => {
    await page.goto('/wallet');

    const balanceText = await page.locator('[data-testid="wallet-balance"]').textContent();
    expect(balanceText).toMatch(/₦[\d,]+\.\d{2}/);
  });
});

test.describe('Creator Tip Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can tip creator', async ({ page }) => {
    await page.goto('/creators/creator-123');

    await page.click('text=Tip Creator');

    await page.fill('input[name="amount"]', '100');
    await page.click('button:has-text("Send Tip")');

    await expect(page.locator('text=Tip sent successfully')).toBeVisible();
  });
});

test.describe('Prediction Market Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can place prediction', async ({ page }) => {
    await page.goto('/sports');

    await page.click('[data-testid="prediction-market"]:first-child');

    await page.click('button[data-testid="option-A"]');
    await page.fill('input[name="stake"]', '50');
    await page.click('button:has-text("Place Prediction")');

    await expect(page.locator('text=Prediction placed')).toBeVisible();
  });
});

test.describe('Game Play Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can play trivia game', async ({ page }) => {
    await page.goto('/games/trivia');

    await page.click('text=Start Game');

    await page.click('[data-testid="answer-option"]:first-child');

    await expect(page.locator('text=Correct!')).toBeVisible();
  });
});
