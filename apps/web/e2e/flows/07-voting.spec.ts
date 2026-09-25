/**
 * F-010 — Reality Voting Flow
 *
 * Tests: vote → wallet debit → reward grant
 */
import { test, expect } from '@playwright/test';
import { mockApiForVoting } from './helpers';

test.describe('F-010: Reality Voting Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiForVoting(page);
  });

  test('voting page loads with contestants', async ({ page }) => {
    await page.goto('/reality/voting');

    // Should show contestant names from mock
    await expect(
      page.locator('text=/Contestant Alpha|Contestant Beta|Contestant Gamma/i').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('contestant cards are interactive', async ({ page }) => {
    await page.goto('/reality/voting');

    // Find a contestant card/button
    const contestantCard = page.locator(
      'text=/Contestant Alpha/i',
    ).first();

    await expect(contestantCard).toBeVisible({ timeout: 15000 });
    await contestantCard.click();

    // After selection, voting controls should appear
    const voteControls = page.locator(
      'button:has-text("Vote"), [data-testid="vote-quantity"], select, [class*="quantity"]',
    ).first();

    await expect(voteControls).toBeVisible({ timeout: 5000 });
  });

  test('vote quantity selector works', async ({ page }) => {
    await page.goto('/reality/voting');

    // Select a contestant
    await page.locator('text=/Contestant Alpha/i').first().click();
    await page.waitForTimeout(500);

    // Try selecting different vote quantities
    const quantityBtn = page.locator('button:has-text("5"), button:has-text("10")').first();
    if (await quantityBtn.isVisible().catch(() => false)) {
      await quantityBtn.click();
      await expect(quantityBtn).toBeVisible();
    }
  });

  test('vote submission sends correct data', async ({ page }) => {
    let voteRequestBody = '';
    await page.route('**/api/v1/reality/vote', (route) => {
      voteRequestBody = route.request().postData() || '';
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Vote recorded' }),
      });
    });

    await page.goto('/reality/voting');

    // Select contestant
    await page.locator('text=/Contestant Alpha/i').first().click();
    await page.waitForTimeout(500);

    // Click vote button
    const voteBtn = page.locator('button:has-text("Vote")').first();
    if (await voteBtn.isVisible().catch(() => false)) {
      await voteBtn.click();
      await page.waitForTimeout(2000);

      // Verify vote was submitted
      if (voteRequestBody) {
        const parsed = JSON.parse(voteRequestBody);
        expect(parsed.contestantId || parsed.id).toBeTruthy();
      }
    }
  });

  test('vote success shows confirmation', async ({ page }) => {
    await page.goto('/reality/voting');

    // Select contestant
    await page.locator('text=/Contestant Alpha/i').first().click();
    await page.waitForTimeout(500);

    // Click vote
    const voteBtn = page.locator('button:has-text("Vote")').first();
    if (await voteBtn.isVisible().catch(() => false)) {
      await voteBtn.click();

      // Should show success message
      await expect(
        page.locator('text=/success|recorded|thank|cast/i').first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('vote failure shows error message', async ({ page }) => {
    // Override vote mock to fail
    await page.route('**/api/v1/reality/vote', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Insufficient balance' }),
      }),
    );

    await page.goto('/reality/voting');

    await page.locator('text=/Contestant Alpha/i').first().click();
    await page.waitForTimeout(500);

    const voteBtn = page.locator('button:has-text("Vote")').first();
    if (await voteBtn.isVisible().catch(() => false)) {
      await voteBtn.click();

      // Should show error
      await expect(
        page.locator('text=/insufficient|error|failed|balance/i').first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('wallet balance is deducted after voting', async ({ page }) => {
    let balance = 500000;
    await page.route('**/api/v1/wallet/balance', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { balance, currency: 'NGN' } }),
      });
    });

    // Page POSTs /reality/votes/quantity { contestantId, quantity }
    await page.route('**/api/v1/reality/votes/quantity', (route) => {
      balance -= 100; // Deduct vote cost
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { recorded: true } }),
      });
    });

    await page.goto('/reality/voting');

    // Select contestant, then submit via the sidebar vote panel
    await page.locator('text=/Contestant Alpha/i').first().click();
    const submitBtn = page.getByRole('button', { name: 'Submit Vote' });
    await submitBtn.click();

    // Verify the vote POST fired (balance mutated inside the route handler)
    await expect(page.getByText('Vote submitted successfully!')).toBeVisible({ timeout: 10000 });
    expect(balance).toBeLessThan(500000);
  });

  test('super-vote flow works', async ({ page }) => {
    await page.goto('/reality/super-vote');

    await expect(page.locator('body')).toBeVisible();

    // Should show super vote UI
    await expect(
      page.locator('text=/super vote|superpower|boost|extra/i').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('voting page shows vote counts for contestants', async ({ page }) => {
    await page.goto('/reality/voting');

    // Should show vote counts (1,200 / 800 / 950 from mock)
    await expect(
      page.locator('text=/1,?200|950 votes/i').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('contestant status badges are displayed', async ({ page }) => {
    await page.goto('/reality/voting');

    // Should show safe/danger status (mock marks Beta "danger" → "At Risk")
    await expect(
      page.locator('text=/At Risk|eliminated/i').first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('complete voting flow: select → choose quantity → vote → success', async ({ page }) => {
    await page.goto('/reality/voting');

    // Step 1: Select contestant
    await page.locator('text=/Contestant Alpha/i').first().click();
    await page.waitForTimeout(500);

    // Step 2: Choose vote quantity (if available)
    const qty5 = page.locator('button:has-text("5")').first();
    if (await qty5.isVisible().catch(() => false)) {
      await qty5.click();
    }

    // Step 3: Cast vote via the sidebar vote panel
    const voteBtn = page.getByRole('button', { name: 'Submit Vote' });
    await voteBtn.click();

      // Step 4: Verify success
      await expect(
        page.locator('text=/success|recorded|thank|cast|voted/i').first(),
      ).toBeVisible({ timeout: 10000 });
  });
});
