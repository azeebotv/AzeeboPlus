import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Watch Parties', () => {
  test.describe('Create Party', () => {
    test('should show start party button on content page', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('button:has-text("Start Party"), [data-testid="start-party-btn"]')).toBeVisible();
      }
    });

    test('should create party and show invite code', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        const startBtn = page.locator('button:has-text("Start Party"), [data-testid="start-party-btn"]');
        if (await startBtn.isVisible()) {
          await startBtn.click();
          await expect(page.locator('[data-testid="invite-code"], .invite-code')).toBeVisible();
        }
      }
    });

    test('should copy invite code to clipboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        const startBtn = page.locator('button:has-text("Start Party"), [data-testid="start-party-btn"]');
        if (await startBtn.isVisible()) {
          await startBtn.click();
          const copyBtn = page.locator('[data-testid="copy-invite"], button:has-text("Copy")');
          if (await copyBtn.isVisible()) {
            await copyBtn.click();
            await expect(page.locator('[data-testid="copied-toast"], .copied-toast')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Join Party', () => {
    test('should show join party option', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      await expect(page.locator('button:has-text("Join Party"), [data-testid="join-party-btn"]')).toBeVisible();
    });

    test('should open join party modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const joinBtn = page.locator('button:has-text("Join Party"), [data-testid="join-party-btn"]');
      if (await joinBtn.isVisible()) {
        await joinBtn.click();
        await expect(page.locator('[data-testid="join-party-modal"], .join-party-modal')).toBeVisible();
      }
    });

    test('should validate invite code format', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const joinBtn = page.locator('button:has-text("Join Party"), [data-testid="join-party-btn"]');
      if (await joinBtn.isVisible()) {
        await joinBtn.click();
        const codeInput = page.locator('input[placeholder*="code"], [data-testid="invite-code-input"]');
        if (await codeInput.isVisible()) {
          await codeInput.fill('invalid');
          const submitBtn = page.locator('button[type="submit"]:has-text("Join")');
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await expect(page.locator('.error, [role="alert"]')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Party Controls', () => {
    test('should show playback controls for host', async ({ page }) => {
      // This test requires being in a party as host
      await page.goto(`${BASE_URL}/movies`);
      await expect(page.locator('[data-testid="party-controls"], .party-controls')).toBeVisible();
    });

    test('should show participant list', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      await expect(page.locator('[data-testid="participant-list"], .participant-list')).toBeVisible();
    });

    test('should show party chat', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      await expect(page.locator('[data-testid="party-chat"], .party-chat')).toBeVisible();
    });
  });

  test.describe('Leave Party', () => {
    test('should show leave party button', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      await expect(page.locator('button:has-text("Leave"), [data-testid="leave-party-btn"]')).toBeVisible();
    });

    test('should confirm before leaving', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const leaveBtn = page.locator('button:has-text("Leave"), [data-testid="leave-party-btn"]');
      if (await leaveBtn.isVisible()) {
        await leaveBtn.click();
        await expect(page.locator('[data-testid="confirm-leave"], .confirm-dialog')).toBeVisible();
      }
    });
  });
});
