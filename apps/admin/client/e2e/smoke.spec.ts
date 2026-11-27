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
  { href: '/users', label: 'Users Directory' },
  { href: '/content', label: 'Content Library' },
  { href: '/content-review', label: 'Review Queue' },
  { href: '/creators', label: 'Creators' },
  { href: '/reality', label: 'Reality Shows' },
  { href: '/universes', label: 'Universes' },
  { href: '/wallets', label: 'Wallets' },
  { href: '/financial', label: 'Financial Overview' },
  { href: '/payment-gateways', label: 'Payment Gateways' },
  { href: '/engagement', label: 'Engagement' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/audit-logs', label: 'Audit Logs' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

async function mockAuth(
  page: import('@playwright/test').Page,
  flags: Array<{ key: string; enabled: boolean }> = [{ key: 'admin_new_dashboard', enabled: true }]
) {
  await page.addInitScript((user) => {
    localStorage.setItem('azeebo_admin_user', JSON.stringify(user));
    localStorage.setItem('azeebo_admin_user_token', 'test-admin-token');
  }, MOCK_ADMIN_USER);

  await page.route('**/api/v1/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_ADMIN_USER }),
    });
  });

  await page.route('**/api/v1/admin/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalUsers: 1250,
          dailyActiveUsers: 340,
          totalContent: 88,
          totalViews: 45000,
          totalRevenue: 1200000,
          newUsers: 45,
        },
      }),
    });
  });

  await page.route('**/api/v1/admin/feature-flags', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: flags,
      }),
    });
  });

  await page.route('**/api/v1/admin/universes/feature-flags**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/v1/admin/audit**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { items: [], total: 0 } }),
    });
  });

  await page.route('**/api/v1/admin/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { users: [], total: 0, page: 1, limit: 20, hasMore: false } }),
    });
  });

  await page.route('**/api/v1/admin/settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

test.describe('Admin App Smoke Tests', () => {
  test.describe('Login Page', () => {
    test('should redirect unauthenticated users to web sign-in', async ({ page }) => {
      await page.route('http://localhost:4000/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Web Login</h1></body></html>',
        });
      });

      await page.goto('/login');
      await expect(page).toHaveURL(/http:\/\/localhost:4000\/auth\/login/);
    });

    test('should display Console branding and role-denied message for non-admin users', async ({ page }) => {
      await page.route('**/api/v1/auth/me**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'user-1', email: 'user@azeebo.com', role: 'user' },
          }),
        });
      });

      await page.goto('/login');

      await expect(page.locator('h1')).toContainText("This account can't open the Console");
      await expect(page.getByText('Console', { exact: true })).toBeVisible();
    });

    test('should show Sign in with an admin account link when role-denied', async ({ page }) => {
      await page.route('**/api/v1/auth/me**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'user-1', email: 'user@azeebo.com', role: 'user' },
          }),
        });
      });

      await page.goto('/login');

      await expect(page.getByRole('link', { name: 'Sign in with an admin account' })).toBeVisible();
    });
  });

  test.describe('Protected Route Redirects', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('http://localhost:4000/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Web Login</h1></body></html>',
        });
      });
    });

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
        await expect(page).toHaveURL(/.*\/auth\/login|.*\/login/);
      });
    }
  });

  test.describe('Authenticated Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page, [{ key: 'admin_new_dashboard', enabled: false }]);
    });

    test('should load dashboard after authentication', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('h1')).toContainText('Executive Dashboard');
    });

    test('should display quick action links on dashboard', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('link', { name: 'Manage Users' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Review Queue', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Creator Channels' })).toBeVisible();
    });

    test('should display top bar with logo', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('header a img[alt="Azeebo+"]')).toBeVisible();
      await expect(page.locator('header a')).toContainText('Console');
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
        await expect(sidebar.getByText(item.label, { exact: true })).toBeVisible();
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
