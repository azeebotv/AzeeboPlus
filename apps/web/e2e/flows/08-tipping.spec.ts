/**
 * F-011 — Tipping Flow
 *
 * Tests: tipping page load, stats display, history listing, send tip form,
 *        preset amount selection, pagination, error states, auth guard
 */
import { test, expect } from '@playwright/test';
import { mockApiForTipping } from './helpers';

test.describe('F-011: Tipping Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiForTipping(page);
  });

  // ─── Page Load & Auth ──────────────────────────────────────────────────

  test('tipping page shows sign-in prompt for unauthenticated users', async ({ page }) => {
    // Clear auth tokens
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('azeebo_access_token');
      localStorage.removeItem('azeebo_refresh_token');
      localStorage.removeItem('azeebo_user');
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Sign in to View Tips').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href*="/auth/login"]')).toBeVisible();
  });

  test('tipping page loads for authenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-access-token');
      localStorage.setItem('azeebo_refresh_token', 'test-refresh-token');
      localStorage.setItem(
        'azeebo_user',
        JSON.stringify({
          id: 'test-user-1',
          email: 'test@azeeboplus.com',
          name: 'Test User',
          displayName: 'TestUser',
          role: 'user',
        }),
      );
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=My Tips').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── Stats Display ─────────────────────────────────────────────────────

  test('shows tipping stats correctly', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Tips Sent').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total Tipped').first()).toBeVisible();
    await expect(page.locator('text=Current Tier').first()).toBeVisible();
  });

  test('displays correct tier badge from stats', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    // Mock returns topTier: 'gold'
    await expect(page.locator('text=Gold').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── History Tab ───────────────────────────────────────────────────────

  test('history tab shows tip entries', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    // History tab should be active by default
    await expect(page.locator('text=Comedy King').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=DJ Master').first()).toBeVisible();
    await expect(page.locator('text=Sports Analyst').first()).toBeVisible();
  });

  test('displays tier badges on history entries', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Gold').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Silver').first()).toBeVisible();
    await expect(page.locator('text=Platinum').first()).toBeVisible();
  });

  test('displays tip amounts in history', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=₦1,000').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=₦500').first()).toBeVisible();
    await expect(page.locator('text=₦2,500').first()).toBeVisible();
  });

  test('displays tip messages', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Love your content!').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Great analysis').first()).toBeVisible();
  });

  // ─── Send Tip Tab ──────────────────────────────────────────────────────

  test('switching to Send Tip tab shows the form', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Send Tip")').click();

    await expect(page.locator('text=Send a Tip').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Creator ID').first()).toBeVisible();
    await expect(page.locator('text=Amount').first()).toBeVisible();
  });

  test('preset amount buttons are clickable', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Send Tip")').click();

    // Should see preset amounts
    await expect(page.locator('button:has-text("₦100")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("₦500")').first()).toBeVisible();
    await expect(page.locator('button:has-text("₦1,000")').first()).toBeVisible();
    await expect(page.locator('button:has-text("₦5,000")').first()).toBeVisible();
    await expect(page.locator('button:has-text("₦10,000")').first()).toBeVisible();

    // Click a preset
    await page.locator('button:has-text("₦1,000")').first().click();

    // Send button should update to show selected amount
    await expect(page.locator('button:has-text("Send ₦1,000")').first()).toBeVisible();
  });

  test('custom amount toggle works', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Send Tip")').click();

    // Click Custom button
    await page.locator('button:has-text("Custom")').click();

    // Custom amount input should appear
    await expect(page.locator('input[placeholder*="Enter amount"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('message input is optional', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Send Tip")').click();

    // Message input should exist with optional label
    await expect(page.locator('text=Message (optional)').first()).toBeVisible({ timeout: 5000 });
  });

  test('send button is disabled without creator ID', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("Send Tip")').click();

    // Send button should be disabled (no creator ID entered)
    const sendBtn = page.locator('button:has-text("Send")').last();
    await expect(sendBtn).toBeDisabled({ timeout: 5000 });
  });

  // ─── Empty State ───────────────────────────────────────────────────────

  test('shows empty state when no tips exist', async ({ page }) => {
    // Override history mock to return empty
    await page.route('**/api/v1/tipping/history*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, totalPages: 0 },
        }),
      }),
    );

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=No tips sent yet').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Send Your First Tip")').first()).toBeVisible();
  });

  // ─── Error State ───────────────────────────────────────────────────────

  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/api/v1/tipping/history*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Internal server error' }),
      }),
    );

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    // Should show error state with retry
    const errorIndicator = page.locator('text=/Failed|Error|retry/i').first();
    await expect(errorIndicator).toBeVisible({ timeout: 10000 });
  });

  // ─── Responsive ────────────────────────────────────────────────────────

  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=My Tips').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tips Sent').first()).toBeVisible();
  });

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=My Tips').first()).toBeVisible({ timeout: 10000 });
  });

  // ─── Navigation ────────────────────────────────────────────────────────

  test('history entry links to creator profile', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azeebo_access_token', 'test-token');
      localStorage.setItem('azeebo_user', JSON.stringify({ id: 'u1', name: 'Test', displayName: 'Test' }));
    });

    await page.goto('/tipping');
    await page.waitForLoadState('networkidle');

    // Each history entry should be a link to the creator
    const entryLink = page.locator('a[href*="/creators/creator-"]').first();
    await expect(entryLink).toBeVisible({ timeout: 10000 });
  });
});
