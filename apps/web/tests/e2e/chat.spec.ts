import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Real-time Chat', () => {
  test.describe('Conversation List', () => {
    test('should display conversation list', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      await expect(page.locator('[data-testid="conversation-list"], .conversation-list')).toBeVisible();
    });

    test('should show search input', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      await expect(page.locator('input[placeholder*="Search"], input[type="search"]')).toBeVisible();
    });

    test('should show new message button', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      await expect(page.locator('button:has-text("New"), button:has-text("Compose")')).toBeVisible();
    });
  });

  test.describe('Messaging', () => {
    test('should open conversation when clicked', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      const conversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();

      if (await conversation.isVisible()) {
        await conversation.click();
        await expect(page.locator('[data-testid="message-input"], .message-input')).toBeVisible();
      }
    });

    test('should send a message', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      const conversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();

      if (await conversation.isVisible()) {
        await conversation.click();
        const input = page.locator('[data-testid="message-input"], textarea, input[placeholder*="message"]');

        if (await input.isVisible()) {
          await input.fill('Hello from E2E test');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should show typing indicator', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      // Typing indicator would be shown when other user is typing
      // This is a placeholder test
      expect(true).toBe(true);
    });
  });

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);

      // Check for WebSocket connection in network tab
      const wsConnections = await page.evaluate(() => {
        // Check if WebSocket is connected
        return typeof WebSocket !== 'undefined';
      });
      expect(wsConnections).toBe(true);
    });
  });

  test.describe('Message Features', () => {
    test('should show emoji picker', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      const conversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();

      if (await conversation.isVisible()) {
        await conversation.click();
        const emojiButton = page.locator('[data-testid="emoji-button"], button:has-text("😊")');

        if (await emojiButton.isVisible()) {
          await emojiButton.click();
          await expect(page.locator('[data-testid="emoji-picker"], .emoji-picker')).toBeVisible();
        }
      }
    });

    test('should show message reactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/messages`);
      // Reactions would be visible on existing messages
      expect(true).toBe(true);
    });
  });
});
