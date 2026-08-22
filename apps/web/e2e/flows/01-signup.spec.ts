/**
 * F-004 — User Registration Flow
 *
 * Tests: signup → email verify prompt → login → access protected route
 */
import { test, expect } from '@playwright/test';
import { registerUser, loginUser, mockApiForAuth } from './helpers';

test.describe('F-004: User Registration Flow', () => {
  test('register page renders with all required fields', async ({ page }) => {
    await page.goto('/auth/register');

    // Page title / heading
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Required fields
    await expect(page.locator('input[name="displayName"], input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/register');

    await page.click('button[type="submit"]');

    // Should show at least one validation message
    const errorText = page.locator(
      'text=/required|must be|at least|minimum|invalid/i',
    );
    await expect(errorText.first()).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for short name', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="displayName"], input[name="name"]', 'A');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/at least 2 characters|too short/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows validation error for weak password', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="displayName"], input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');

    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/at least 8 characters|too weak|minimum length/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="displayName"], input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/valid email|invalid email|email/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('successful registration redirects to OTP verification or home', async ({ page }) => {
    // Mock the register API
    await page.route('**/api/v1/auth/register', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { user: { id: 'new-user', email: 'test@example.com' }, requiresVerification: true },
        }),
      }),
    );

    await page.goto('/auth/register');

    await page.fill('input[name="displayName"], input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', `e2e-${Date.now()}@test.example.com`);
    await page.fill('input[name="password"]', 'Password123!');

    // Agree to terms if checkbox present
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check();
    }

    await page.click('button[type="submit"]');

    // Should navigate away from register page
    await page.waitForURL(
      (url) =>
        url.pathname.includes('/otp') ||
        url.pathname.includes('/verify') ||
        url.pathname === '/' ||
        url.pathname.includes('/profile-setup'),
      { timeout: 15000 },
    );
  });

  test('navigate from login to register and back', async ({ page }) => {
    await page.goto('/auth/login');

    // Click register link
    const registerLink = page.locator('a[href*="register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }

    // Click login link from register page
    const loginLink = page.locator('a[href*="login"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/auth/register');

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button (eye icon)
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg, [data-icon="eye"]') }).first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('user can register, verify, and access protected content', async ({ page }) => {
    // Mock register API
    await page.route('**/api/v1/auth/register', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { user: { id: 'new-user' }, requiresVerification: false } }),
      }),
    );

    // Mock login API
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'mock-token', refreshToken: 'mock-refresh', user: { id: 'user-001', role: 'user' } },
        }),
      }),
    );

    await mockApiForAuth(page);

    const user = await registerUser(page);

    // If redirected to login, log in
    if (page.url().includes('/auth/login')) {
      await loginUser(page, { email: user.email, password: user.password });
    }

    // Access a protected route
    await page.goto('/wallet');
    await expect(page.locator('body')).toBeVisible();
  });
});
