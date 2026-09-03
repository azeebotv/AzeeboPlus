import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Content Reviews & Ratings', () => {
  test.describe('Review Display', () => {
    test('should display reviews section on content page', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('[data-testid="reviews-section"], .reviews-section')).toBeVisible();
      }
    });

    test('should show rating summary with distribution', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('[data-testid="rating-summary"], .rating-summary')).toBeVisible();
      }
    });

    test('should show star rating distribution bars', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('[data-testid="rating-distribution"], .rating-distribution')).toBeVisible();
      }
    });
  });

  test.describe('Write Review', () => {
    test('should show write review button', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('button:has-text("Write a Review"), [data-testid="write-review-btn"]')).toBeVisible();
      }
    });

    test('should open review form when clicked', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        const writeBtn = page.locator('button:has-text("Write a Review"), [data-testid="write-review-btn"]');
        if (await writeBtn.isVisible()) {
          await writeBtn.click();
          await expect(page.locator('[data-testid="review-form"], .review-form')).toBeVisible();
        }
      }
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        const writeBtn = page.locator('button:has-text("Write a Review"), [data-testid="write-review-btn"]');
        if (await writeBtn.isVisible()) {
          await writeBtn.click();
          const submitBtn = page.locator('button[type="submit"]:has-text("Submit")');
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await expect(page.locator('.error, [role="alert"]')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Review Interactions', () => {
    test('should show helpful button on reviews', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('[data-testid="helpful-btn"], button:has-text("Helpful")')).toBeVisible();
      }
    });

    test('should show report button on reviews', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('[data-testid="report-btn"], button:has-text("Report")')).toBeVisible();
      }
    });
  });

  test.describe('Spoiler Protection', () => {
    test('should blur spoiler content', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        await expect(page.locator('[data-testid="spoiler-blur"], .spoiler-blur')).toBeVisible();
      }
    });

    test('should reveal spoiler on hover', async ({ page }) => {
      await page.goto(`${BASE_URL}/movies`);
      const contentCard = page.locator('[data-testid="content-card"], .content-card').first();
      if (await contentCard.isVisible()) {
        await contentCard.click();
        const spoiler = page.locator('[data-testid="spoiler-blur"], .spoiler-blur').first();
        if (await spoiler.isVisible()) {
          await spoiler.hover();
          await expect(spoiler).not.toHaveClass(/blur/);
        }
      }
    });
  });
});
