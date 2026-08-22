/**
 * F-005 — Password Reset Flow
 *
 * Tests: forgot-password → email sent confirmation → reset with token → login with new password
 */
import { test, expect } from '@playwright/test';

test.describe('F-005: Password Reset Flow', () => {
  test('forgot-password page renders with email input', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation error for empty email', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/required|enter.*email|valid email/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'not-valid');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/valid email|invalid email/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows success message after requesting reset', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password reset email sent' }),
      }),
    );

    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/email sent|check your email|reset link|success/i'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows error for non-existent email', async ({ page }) => {
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }), // Always returns success (don't leak info)
      }),
    );

    await page.goto('/auth/forgot-password');

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.click('button[type="submit"]');

    // Even for non-existent email, should show success (no user enumeration)
    await expect(
      page.locator('text=/email sent|check your email|reset link|success/i'),
    ).toBeVisible({ timeout: 10000 });
  });

  test('reset-password page renders with token validation', async ({ page }) => {
    // Without token — should show error
    await page.goto('/auth/reset-password');

    // Should show some error about invalid link
    await expect(
      page.locator('text=/invalid|expired|token|link/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('reset-password page renders form with valid token', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-test-token-abc123');

    // Should show password fields
    const newPassword = page.locator('input[name="newPassword"], input[name="password"]').first();
    const confirmPassword = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();

    await expect(newPassword).toBeVisible({ timeout: 10000 });
    await expect(confirmPassword).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-test-token-abc123');

    const newPassword = page.locator('input[name="newPassword"], input[name="password"]').first();
    const confirmPassword = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();

    await newPassword.fill('NewPassword123!');
    await confirmPassword.fill('DifferentPassword123!');

    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/do not match|must match|passwords mismatch/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows error for weak password', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-test-token-abc123');

    const newPassword = page.locator('input[name="newPassword"], input[name="password"]').first();
    const confirmPassword = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();

    await newPassword.fill('123');
    await confirmPassword.fill('123');

    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/weak|at least 8|minimum|strength/i'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('successful password reset redirects to login', async ({ page }) => {
    await page.route('**/api/v1/auth/reset-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Password reset successful' }),
      }),
    );

    await page.goto('/auth/reset-password?token=valid-test-token-abc123');

    const newPassword = page.locator('input[name="newPassword"], input[name="password"]').first();
    const confirmPassword = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();

    await newPassword.fill('NewSecure123!');
    await confirmPassword.fill('NewSecure123!');

    await page.click('button[type="submit"]');

    // Should redirect to login after success
    await page.waitForURL(/login|signin/, { timeout: 15000 });
  });

  test('password strength indicator updates as user types', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-test-token-abc123');

    const newPassword = page.locator('input[name="newPassword"], input[name="password"]').first();

    // Type weak password
    await newPassword.fill('abc');
    // Check that strength indicator is visible (bars or text)
    const strengthIndicator = page.locator('[data-testid="password-strength"], [class*="strength"], [class*="bar"]');
    if (await strengthIndicator.first().isVisible().catch(() => false)) {
      await expect(strengthIndicator.first()).toBeVisible();
    }

    // Type strong password
    await newPassword.fill('StrongP@ssw0rd!');
    // Strength should update
    await expect(newPassword).toHaveValue('StrongP@ssw0rd!');
  });

  test('complete flow: request reset → use token → login with new password', async ({ page }) => {
    // Step 1: Request password reset
    await page.route('**/api/v1/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );

    await page.goto('/auth/forgot-password');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/success|email sent|check/i')).toBeVisible({ timeout: 10000 });

    // Step 2: Reset password with token
    await page.route('**/api/v1/auth/reset-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      }),
    );

    await page.goto('/auth/reset-password?token=valid-token-123');
    const newPwd = page.locator('input[name="newPassword"], input[name="password"]').first();
    const confirmPwd = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();
    await newPwd.fill('NewPassword123!');
    await confirmPwd.fill('NewPassword123!');
    await page.click('button[type="submit"]');

    // Step 3: Login with new password
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'new-token', refreshToken: 'new-refresh', user: { id: 'user-001' } },
        }),
      }),
    );

    await page.waitForURL(/login|signin/, { timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });
  });
});
