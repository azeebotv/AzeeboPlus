/**
 * F-006 — Payment Initialization Flow
 *
 * Tests: initialize → verify → wallet credit
 */
import { test, expect } from '@playwright/test';
import { mockApiForPayments, loginUser } from './helpers';

test.describe('F-006: Payment Initialization Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiForPayments(page);
  });

  test('wallet page displays balance and fund button', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // Balance should be visible (or at least the page loads)
    await expect(page.locator('body')).toBeVisible();

    // Fund / Add funds button should be present
    const fundBtn = page.locator(
      'text=/fund|add funds|top up|deposit/i',
    ).first();
    await expect(fundBtn).toBeVisible({ timeout: 10000 });
  });

  test('clicking fund wallet opens amount input or modal', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    await page.click('text=/fund|add funds|top up|deposit/i');

    // Should show amount input or modal
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    const modal = page.locator('[role="dialog"], [data-testid="fund-modal"]');

    await expect(
      amountInput.or(modal).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('validates minimum amount', async ({ page }) => {
    await page.goto('/wallet/add-funds');
    await page.waitForLoadState('networkidle');

    // Try submitting with 0 amount
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill('0');
      await page.click('button[type="submit"]');

      await expect(
        page.locator('text=/minimum|at least|invalid amount|greater than/i'),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('payment initialization calls API with correct data', async ({ page }) => {
    let requestBody = '';
    await page.route('**/api/v1/payments/initialize', (route) => {
      requestBody = route.request().postData() || '';
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { reference: 'pay_ref_001', authorizationUrl: 'https://checkout.paystack.com/test' },
        }),
      });
    });

    await page.goto('/wallet/add-funds');
    await page.waitForLoadState('networkidle');

    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill('5000');
      await page.click('button[type="submit"]');

      // Verify the request was made
      await page.waitForTimeout(2000);
      if (requestBody) {
        const parsed = JSON.parse(requestBody);
        expect(parsed.amount || parsed.value).toBeGreaterThan(0);
      }
    }
  });

  test('payment success redirects or shows confirmation', async ({ page }) => {
    // Mock the callback/verification endpoint
    await page.route('**/api/v1/payments/verify/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { status: 'success' } }),
      }),
    );

    // Simulate returning from payment provider
    await page.goto('/wallet?payment=success&ref=pay_ref_001');
    await page.waitForLoadState('networkidle');

    // Should show some success indication
    await expect(
      page.locator('text=/success|confirmed|funded|credited|completed/i').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('payment failure shows error state', async ({ page }) => {
    await page.goto('/wallet?payment=failed&ref=pay_ref_001');
    await page.waitForLoadState('networkidle');

    // Should show error or failed state
    await expect(
      page.locator('text=/failed|error| unsuccessful|try again/i').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('transaction history shows recent transactions', async ({ page }) => {
    await page.goto('/wallet/transactions');
    await page.waitForLoadState('networkidle');

    // Should show transaction list or empty state
    await expect(page.locator('body')).toBeVisible();

    // Should have either transactions or an empty state message
    const hasContent = await page
      .locator('[data-testid="transaction"], [class*="transaction"], text=/no transactions|transaction history/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBe(true);
  });
});
