/**
 * Creator Dashboard E2E Tests
 *
 * Verifies that the creator app loads correctly, login works,
 * and the dashboard displays data from backend services.
 *
 * Run: npx playwright test --config=e2e/creator/playwright.config.ts --project=chromium
 * Requires: all services running via ./start-all.sh
 */
import { test, expect } from '@playwright/test';

const CREATOR_URL = process.env.CREATOR_URL || 'http://localhost:5174';
const CREATOR_EMAIL = process.env.CREATOR_EMAIL || 'creator@azeeboplus.com';
const CREATOR_PASSWORD = process.env.CREATOR_PASSWORD || 'Creator123!';

/* ═══════════════════════════════════════════════════════════════════════════════
   1. CREATOR APP SMOKE TESTS — Basic connectivity and login
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('1. Creator App Smoke Tests', () => {
  test('creator app serves HTML', async ({ request }) => {
    const response = await request.fetch(`${CREATOR_URL}/`, { timeout: 10_000 });
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('text/html');
  });

  test('login page renders with form fields', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Should have email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });
  });

  test('login page has submit button', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/login`);
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await expect(submitButton).toBeVisible({ timeout: 10_000 });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   2. CREATOR LOGIN FLOW — Authentication through the creator app
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('2. Creator Login Flow', () => {
  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'WrongPassword123!');

    // Click submit
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');

    // Should show error message (not crash)
    await page.waitForTimeout(2000);
    // Page should still be on login (not redirected to dashboard)
    expect(page.url()).toContain('login');
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill in valid credentials
    await page.fill('input[type="email"], input[name="email"]', CREATOR_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', CREATOR_PASSWORD);

    // Click submit
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');

    // Should redirect away from login (to dashboard or home)
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
    expect(page.url()).not.toContain('login');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   3. CREATOR DASHBOARD — Verify dashboard loads with data
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('3. Creator Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${CREATOR_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', CREATOR_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', CREATOR_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
  });

  test('dashboard page loads without errors', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${CREATOR_URL}/`);
    await page.waitForLoadState('networkidle');

    // Should not show error boundary
    const errorBoundary = page.locator('text=Something went wrong, text=Error');
    const hasError = await errorBoundary.count();
    expect(hasError).toBe(0);
  });

  test('dashboard shows navigation menu', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/`);
    await page.waitForLoadState('networkidle');

    // Should have navigation links
    const nav = page.locator('nav, [role="navigation"], .sidebar, .menu');
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to content page', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/`);
    await page.waitForLoadState('networkidle');

    // Click on content link
    const contentLink = page.locator('a[href*="content"], a:has-text("Content")');
    if (await contentLink.count() > 0) {
      await contentLink.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('content');
    }
  });

  test('can navigate to earnings page', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/`);
    await page.waitForLoadState('networkidle');

    // Click on earnings link
    const earningsLink = page.locator('a[href*="earnings"], a:has-text("Earnings")');
    if (await earningsLink.count() > 0) {
      await earningsLink.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('earnings');
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   4. CREATOR API PROXY — Verify API calls work through creator app
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('4. Creator API Proxy', () => {
  test('creator health endpoint responds', async ({ request }) => {
    const response = await request.fetch(`${CREATOR_URL}/api/v1/health`, { timeout: 10_000 });
    expect(response.status()).toBe(200);
  });

  test('creator content endpoint requires auth', async ({ request }) => {
    const response = await request.fetch(`${CREATOR_URL}/api/v1/creator/content`, { timeout: 10_000 });
    expect([401, 403]).toContain(response.status());
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   5. CREATOR CONTENT MANAGEMENT — Verify content CRUD flows
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('5. Creator Content Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${CREATOR_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', CREATOR_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', CREATOR_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
  });

  test('content manager page loads', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/content-manager`);
    await page.waitForLoadState('networkidle');

    // Should not crash
    const errorBoundary = page.locator('text=Something went wrong');
    const hasError = await errorBoundary.count();
    expect(hasError).toBe(0);
  });

  test('drafts page loads', async ({ page }) => {
    await page.goto(`${CREATOR_URL}/drafts`);
    await page.waitForLoadState('networkidle');

    // Should not crash
    const errorBoundary = page.locator('text=Something went wrong');
    const hasError = await errorBoundary.count();
    expect(hasError).toBe(0);
  });
});
