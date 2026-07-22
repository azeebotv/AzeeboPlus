import { test, expect } from '@playwright/test';

const MOCK_CREATOR_USER = {
  id: 'test-creator-001',
  email: 'creator@azeebo.com',
  name: 'Test Creator',
  displayName: 'Test Creator',
  role: 'creator',
};

const CREATOR_NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/overview', label: 'Overview' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/earnings', label: 'Earnings' },
  { href: '/content', label: 'Content' },
  { href: '/settings', label: 'Settings' },
];

async function mockAuth(page: import('@playwright/test').Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('azeebo_creator_user', JSON.stringify(user));
  }, MOCK_CREATOR_USER);
}

test.describe('Creator App Smoke Tests', () => {
  test.describe('Login Page', () => {
    test('should render login form with email and password fields', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display Creator Portal branding', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('Creator Portal');
    });

    test('should show Sign In button text', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
    });
  });

  test.describe('Protected Route Redirects', () => {
    const protectedRoutes = [
      '/',
      '/overview',
      '/analytics',
      '/earnings',
      '/content',
      '/settings',
    ];

    for (const route of protectedRoutes) {
      test(`should redirect ${route || '/'} to login when unauthenticated`, async ({ page }) => {
        await page.goto(route);
        await expect(page).toHaveURL(/.*login/);
      });
    }
  });

  test.describe('Authenticated Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
    });

    test('should load dashboard after authentication', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('h1')).toContainText('Welcome back');
    });

    test('should display top bar with logo', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('header a')).toContainText('Azeebo+ Creator');
    });

    test('should display user email in top bar', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText(MOCK_CREATOR_USER.email)).toBeVisible();
    });

    test('should display logout button', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
      await page.goto('/');
    });

    test('should render sidebar navigation with all menu items', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Creator navigation"]');
      await expect(sidebar).toBeVisible();

      for (const item of CREATOR_NAV_ITEMS) {
        await expect(sidebar.getByText(item.label)).toBeVisible();
      }
    });

    test('should have correct navigation links', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Creator navigation"]');

      for (const item of CREATOR_NAV_ITEMS) {
        const link = sidebar.locator(`a[href="${item.href}"]`);
        await expect(link).toBeVisible();
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Creator navigation"]');
      const dashboardLink = sidebar.locator('a[href="/"]');

      await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to different pages via sidebar', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Creator navigation"]');

      await sidebar.getByText('Analytics').click();
      await expect(page).toHaveURL(/.*analytics/);

      await sidebar.getByText('Settings').click();
      await expect(page).toHaveURL(/.*settings/);
    });
  });

  test.describe('Page Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page);
    });

    test('should load overview page', async ({ page }) => {
      await page.goto('/overview');
      await expect(page.locator('h1')).toContainText('Overview');
    });

    test('should load analytics page', async ({ page }) => {
      await page.goto('/analytics');
      await expect(page.locator('h1')).toContainText('Analytics');
    });

    test('should load earnings page', async ({ page }) => {
      await page.goto('/earnings');
      await expect(page.locator('h1')).toContainText('Earnings');
    });

    test('should load content page', async ({ page }) => {
      await page.goto('/content');
      await expect(page.locator('h1')).toContainText('Content');
    });

    test('should load settings page', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.locator('h1')).toContainText('Settings');
    });
  });
});
