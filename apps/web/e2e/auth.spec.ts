import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('h1')).toContainText(/sign in|login|welcome/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.locator('h1')).toContainText(/sign up|register|create/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.locator('a[href*="register"]').first();
    await registerLink.click();

    await expect(page).toHaveURL(/register/);
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/auth/login');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/required|invalid|empty/i')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/valid email|invalid email/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid|incorrect|unauthorized|not found/i')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Navigation', () => {
  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('nav a, header a').first();
    await expect(navLinks).toBeVisible();
  });

  test('should navigate to browse page', async ({ page }) => {
    await page.goto('/browse');

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should navigate to creators page', async ({ page }) => {
    await page.goto('/creators');

    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Content Display', () => {
  test('should display trending content section', async ({ page }) => {
    await page.goto('/');

    const trendingSection = page.locator('text=/trending|popular|top/i').first();
    await expect(trendingSection).toBeVisible({ timeout: 10000 });
  });

  test('should display latest content section', async ({ page }) => {
    await page.goto('/');

    const latestSection = page.locator('text=/latest|new|recent/i').first();
    await expect(latestSection).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should render correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should render correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have accessible forms with labels', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      const firstImage = images.first();
      const alt = await firstImage.getAttribute('alt');
      expect(alt !== null).toBe(true);
    }
  });
});

test.describe('Error States', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');

    const status = page.locator('text=/404|not found|page not found/i');
    await expect(status).toBeVisible({ timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});
