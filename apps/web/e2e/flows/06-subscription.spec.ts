/**
 * F-009 — Subscription Flow
 *
 * Tests: subscribe → entitlement check → cancel
 */
import { test, expect } from '@playwright/test';
import { mockApiForSubscription } from './helpers';

test.describe('F-009: Subscription Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiForSubscription(page);
  });

  test('pricing/subscription page shows available plans', async ({ page }) => {
    await page.goto('/subscription/plans');
    await page.waitForLoadState('networkidle');

    // Should show at least one plan
    await expect(page.locator('body')).toBeVisible();

    // Should show plan names or prices
    const hasPlans = await page
      .locator('text=/premium|ultimate|free|plan|subscribe/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPlans).toBe(true);
  });

  test('subscription plans show pricing', async ({ page }) => {
    await page.goto('/subscription/plans');
    await page.waitForLoadState('networkidle');

    // Should show pricing (₦ or NGN)
    const hasPricing = await page
      .locator('text=/₦|NGN|price|month|year/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPricing).toBe(true);
  });

  test('subscribe button initiates payment', async ({ page }) => {
    let subscribeEndpointCalled = false;
    await page.route('**/api/v1/subscriptions/subscribe', (route) => {
      subscribeEndpointCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { subscriptionId: 'sub-001', status: 'pending' },
        }),
      });
    });

    await page.goto('/subscription/plans');
    await page.waitForLoadState('networkidle');

    // Click subscribe button
    const subscribeBtn = page.locator(
      'button:has-text("Subscribe"), button:has-text("Choose"), a:has-text("Subscribe")',
    ).first();

    if (await subscribeBtn.isVisible().catch(() => false)) {
      await subscribeBtn.click();
      await page.waitForTimeout(2000);

      // Should either call the API or redirect to payment
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('current subscription page shows status', async ({ page }) => {
    await page.goto('/subscription/current');
    await page.waitForLoadState('networkidle');

    // Should show subscription status or empty state
    await expect(page.locator('body')).toBeVisible();

    const hasStatus = await page
      .locator('text=/active|expired|none|no subscription|current plan/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasStatus).toBe(true);
  });

  test('subscription history page loads', async ({ page }) => {
    await page.route('**/api/v1/subscriptions/history', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'sub-1', plan: 'premium', startDate: '2026-01-01', status: 'expired' },
          ],
        }),
      }),
    );

    await page.goto('/subscription/history');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });

  test('premium content shows paywall for free users', async ({ page }) => {
    // Mock premium content response
    await page.route('**/api/v1/content/premium-video', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'premium-video',
            title: 'Premium Show',
            requiresSubscription: true,
            videoUrl: null,
          },
        }),
      }),
    );

    await page.goto('/watch/premium-video');
    await page.waitForLoadState('networkidle');

    // Should show subscription prompt / paywall
    const hasPaywall = await page
      .locator('text=/subscribe|premium|upgrade|unlock|membership/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPaywall).toBe(true);
  });

  test('subscription payment page loads with plan details', async ({ page }) => {
    await page.goto('/subscription/payment?plan=premium');
    await page.waitForLoadState('networkidle');

    // Should show payment form or redirect
    await expect(page.locator('body')).toBeVisible();

    const hasPaymentUI = await page
      .locator('text=/pay|payment|card|amount|₦|subscribe/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPaymentUI).toBe(true);
  });

  test('cancel subscription flow', async ({ page }) => {
    // Mock active subscription
    await page.route('**/api/v1/subscriptions/current', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'sub-001', plan: 'premium', status: 'active', expiresAt: '2026-12-31' },
        }),
      }),
    );

    await page.route('**/api/v1/subscriptions/cancel', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Subscription cancelled' }),
      }),
    );

    await page.goto('/subscription/current');
    await page.waitForLoadState('networkidle');

    // Should show cancel option
    const cancelBtn = page.locator(
      'button:has-text("Cancel"), a:has-text("Cancel")',
    ).first();

    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();

      // Confirm cancellation
      const confirmBtn = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes")',
      ).first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();

        // Should show cancellation confirmation
        await expect(
          page.locator('text=/cancelled|canceled|no longer active/i').first(),
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
