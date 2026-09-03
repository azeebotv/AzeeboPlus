import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should display login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page).toHaveTitle(/login|sign in/i);
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('button[type="submit"]');
      await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error, [role="alert"]')).toContainText(/invalid|incorrect/i);
    });

    test('should redirect to homepage after successful login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home');
      expect(page.url()).toContain('/home');
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.click('a[href*="register"], button:has-text("Register")');
      expect(page.url()).toContain('/register');
    });
  });

  test.describe('Registration', () => {
    test('should display registration page', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await expect(page).toHaveTitle(/register|sign up/i);
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="email"], input[name="email"]', 'notanemail');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.fill('input[type="password"], input[name="password"]', 'weak');
      await expect(page.locator('.password-strength, [data-testid="password-strength"]')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login page', async ({ page }) => {
      // First login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home');

      // Then logout
      await page.click('[data-testid="user-menu"], .user-menu');
      await page.click('button:has-text("Logout"), button:has-text("Sign Out")');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto(`${BASE_URL}/profile`);
      expect(page.url()).toContain('/login');
    });

    test('should allow authenticated users to access profile', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home');

      // Navigate to protected route
      await page.goto(`${BASE_URL}/profile`);
      await expect(page.locator('.profile, [data-testid="profile"]')).toBeVisible();
    });
  });
});
