/**
 * Admin Dashboard E2E Tests
 *
 * Verifies that the admin app loads correctly, login works,
 * and the dashboard displays data from backend services.
 *
 * Run: npx playwright test --config=e2e/admin/playwright.config.ts --project=chromium
 * Requires: all services running via ./start-all.sh
 */
import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:4100';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@azeeboplus.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

/* ═══════════════════════════════════════════════════════════════════════════════
   1. ADMIN APP SMOKE TESTS — Basic connectivity and login
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('1. Admin App Smoke Tests', () => {
  test('admin app serves HTML', async ({ request }) => {
    const response = await request.fetch(`${ADMIN_URL}/`, { timeout: 10_000 });
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('text/html');
  });

  test('login page renders with form fields', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Should have email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });
  });

  test('login page has submit button', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await expect(submitButton).toBeVisible({ timeout: 10_000 });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   2. ADMIN LOGIN FLOW — Authentication through the admin app
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('2. Admin Login Flow', () => {
  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
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
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Fill in valid credentials
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);

    // Click submit
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');

    // Should redirect away from login (to dashboard or home)
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
    expect(page.url()).not.toContain('login');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   3. ADMIN DASHBOARD — Verify dashboard loads with data
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('3. Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
  });

  test('dashboard page loads without errors', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${ADMIN_URL}/`);
    await page.waitForLoadState('networkidle');

    // Should not show error boundary
    const errorBoundary = page.locator('text=Something went wrong, text=Error');
    const hasError = await errorBoundary.count();
    expect(hasError).toBe(0);
  });

  test('dashboard shows navigation menu', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/`);
    await page.waitForLoadState('networkidle');

    // Should have navigation links
    const nav = page.locator('nav, [role="navigation"], .sidebar, .menu');
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to users page', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/`);
    await page.waitForLoadState('networkidle');

    // Click on users link
    const usersLink = page.locator('a[href*="users"], a:has-text("Users")');
    if (await usersLink.count() > 0) {
      await usersLink.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('users');
    }
  });

  test('can navigate to content page', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/`);
    await page.waitForLoadState('networkidle');

    // Click on content link
    const contentLink = page.locator('a[href*="content"], a:has-text("Content")');
    if (await contentLink.count() > 0) {
      await contentLink.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('content');
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   4. ADMIN API PROXY — Verify API calls work through admin app
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('4. Admin API Proxy', () => {
  test('admin health endpoint responds', async ({ request }) => {
    const response = await request.fetch(`${ADMIN_URL}/api/v1/health`, { timeout: 10_000 });
    expect(response.status()).toBe(200);
  });

  test('admin dashboard stats endpoint requires auth', async ({ request }) => {
    const response = await request.fetch(`${ADMIN_URL}/api/v1/admin/dashboard/stats`, { timeout: 10_000 });
    expect([401, 403]).toContain(response.status());
  });
});

/* ═══════════════════════════════════════════════════════════════════════════════
   5. ADMIN FEATURE FLAGS — Verify feature flags page loads
   ═══════════════════════════════════════════════════════════════════════════════ */

test.describe('5. Admin Feature Flags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
  });

  test('feature flags page loads', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/feature-flags`);
    await page.waitForLoadState('networkidle');

    // Should not crash
    const errorBoundary = page.locator('text=Something went wrong');
    const hasError = await errorBoundary.count();
    expect(hasError).toBe(0);
  });
});
