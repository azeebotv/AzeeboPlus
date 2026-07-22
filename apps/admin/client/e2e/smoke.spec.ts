import { test, expect } from '@playwright/test';

const MOCK_ADMIN_USER = {
  id: 'test-admin-001',
  email: 'admin@azeebo.com',
  name: 'Test Admin',
  displayName: 'Test Admin',
  role: 'admin',
};

const ADMIN_NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/overview', label: 'Overview' },
  { href: '/users', label: 'Users' },
  { href: '/content', label: 'Content' },
  { href: '/content-review', label: 'Review Queue' },
  { href: '/creators', label: 'Creators' },
  { href: '/reality', label: 'Reality Shows' },
  { href: '/universes', label: 'Universes' },
  { href: '/wallets', label: 'Wallets' },
  { href: '/financial', label: 'Financial' },
  { href: '/payment-gateways', label: 'Payments' },
  { href: '/engagement', label: 'Engagement' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/audit-logs', label: 'Audit Logs' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

async function mockAuth(page: import('@playwright/test').Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('azeebo_admin_user', JSON.stringify(user));
  }, MOCK_ADMIN_USER);
}

test.describe('Admin App Smoke Tests', () => {
  test.describe('Login Page', () => {
    test('should render login form with email and password fields', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display Azeebo+ Admin branding', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('Azeebo+ Admin');
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
      '/users',
      '/content',
      '/content-review',
      '/creators',
      '/reality',
      '/universes',
      '/wallets',
      '/financial',
      '/payment-gateways',
      '/engagement',
      '/notifications',
      '/announcements',
      '/audit-logs',
      '/reports',
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

      await expect(page.locator('h1')).toContainText('Admin Dashboard');
    });

    test('should display quick action links on dashboard', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('Manage Users')).toBeVisible();
      await expect(page.getByText('Review Queue')).toBeVisible();
      await expect(page.getByText('Manage Creators')).toBeVisible();
    });

    test('should display top bar with logo', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('header a')).toContainText('Azeebo+ Admin');
    });

    test('should display user email in top bar', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText(MOCK_ADMIN_USER.email)).toBeVisible();
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
      const sidebar = page.locator('aside[aria-label="Admin navigation"]');
      await expect(sidebar).toBeVisible();

      for (const item of ADMIN_NAV_ITEMS) {
        await expect(sidebar.getByText(item.label)).toBeVisible();
      }
    });

    test('should have correct navigation links', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Admin navigation"]');

      for (const item of ADMIN_NAV_ITEMS) {
        const link = sidebar.locator(`a[href="${item.href}"]`);
        await expect(link).toBeVisible();
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Admin navigation"]');
      const dashboardLink = sidebar.locator('a[href="/"]');

      await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to different pages via sidebar', async ({ page }) => {
      const sidebar = page.locator('aside[aria-label="Admin navigation"]');

      await sidebar.getByText('Users').click();
      await expect(page).toHaveURL(/.*users/);

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

    test('should load users page', async ({ page }) => {
      await page.goto('/users');
      await expect(page.locator('h1')).toContainText('Users');
    });

    test('should load settings page', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.locator('h1')).toContainText('Settings');
    });
  });
});
