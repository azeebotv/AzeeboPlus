import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('user can register and login', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
  });

  test('shows error for invalid login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});

test.describe('Content Watch Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can browse and watch content', async ({ page }) => {
    await page.goto('/browse');

    await expect(page.locator('text=Trending')).toBeVisible();

    await page.click('[data-testid="content-card"]:first-child');

    await expect(page).toHaveURL(/\/watch\/.+/);
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
  });

  test('premium content requires subscription', async ({ page }) => {
    await page.goto('/watch/premium-content-id');

    await expect(page.locator('text=Subscribe to watch')).toBeVisible();
  });
});

test.describe('Wallet Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can fund wallet', async ({ page }) => {
    await page.goto('/wallet');

    await page.click('text=Fund Wallet');

    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="method"]', 'card');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Payment initiated')).toBeVisible();
  });

  test('shows correct balance after funding', async ({ page }) => {
    await page.goto('/wallet');

    const balanceText = await page.locator('[data-testid="wallet-balance"]').textContent();
    expect(balanceText).toMatch(/₦[\d,]+\.\d{2}/);
  });
});

test.describe('Creator Tip Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can tip creator', async ({ page }) => {
    await page.goto('/creators/creator-123');

    await page.click('text=Tip Creator');

    await page.fill('input[name="amount"]', '100');
    await page.click('button:has-text("Send Tip")');

    await expect(page.locator('text=Tip sent successfully')).toBeVisible();
  });
});

test.describe('Prediction Market Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can place prediction', async ({ page }) => {
    await page.goto('/sports');

    await page.click('[data-testid="prediction-market"]:first-child');

    await page.click('button[data-testid="option-A"]');
    await page.fill('input[name="stake"]', '50');
    await page.click('button:has-text("Place Prediction")');

    await expect(page.locator('text=Prediction placed')).toBeVisible();
  });
});

test.describe('Game Play Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can play trivia game', async ({ page }) => {
    await page.goto('/games/trivia');

    await page.click('text=Start Game');

    await page.click('[data-testid="answer-option"]:first-child');

    await expect(page.locator('text=Correct!')).toBeVisible();
  });
});

test.describe('Reality Show Voting Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can vote for contestant', async ({ page }) => {
    await page.goto('/reality/show-123');

    await expect(page.locator('text=Vote for your favorite')).toBeVisible();

    await page.click('[data-testid="contestant-card"]:first-child button');

    await expect(page.locator('text=Vote cast successfully')).toBeVisible();
  });

  test('shows voting limits', async ({ page }) => {
    await page.goto('/reality/show-123');

    const votesRemaining = await page.locator('[data-testid="votes-remaining"]').textContent();
    expect(votesRemaining).toMatch(/\d+ votes remaining/);
  });
});

test.describe('Rewards Redemption Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can redeem points for bonus', async ({ page }) => {
    await page.goto('/rewards');

    await expect(page.locator('[data-testid="points-balance"]')).toBeVisible();

    await page.fill('input[name="points"]', '1000');
    await page.click('button:has-text("Redeem")');

    await expect(page.locator('text=Points redeemed successfully')).toBeVisible();
  });

  test('shows rewards history', async ({ page }) => {
    await page.goto('/rewards/history');

    await expect(page.locator('text=Redemption History')).toBeVisible();
  });
});

test.describe('Content Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'creator@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('creator can upload video content', async ({ page }) => {
    await page.goto('/creators/dashboard');

    await page.click('text=Upload Content');

    await page.setInputFiles('input[type="file"]', 'tests/fixtures/test-video.mp4');
    await page.fill('input[name="title"]', 'Test Video');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Upload started')).toBeVisible();
  });

  test('shows content status', async ({ page }) => {
    await page.goto('/creators/dashboard');

    await expect(page.locator('[data-testid="content-status"]')).toBeVisible();
  });
});

test.describe('Admin Moderation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('admin can review flagged content', async ({ page }) => {
    await page.goto('/admin/content');

    await expect(page.locator('text=Flagged Content')).toBeVisible();

    await page.click('[data-testid="flagged-content"]:first-child');

    await expect(page.locator('text=Review Content')).toBeVisible();
  });

  test('admin can take moderation action', async ({ page }) => {
    await page.goto('/admin/content');

    await page.click('[data-testid="flagged-content"]:first-child');
    await page.click('button:has-text("Approve")');

    await expect(page.locator('text=Action taken')).toBeVisible();
  });

  test('admin can manage users', async ({ page }) => {
    await page.goto('/admin/users');

    await expect(page.locator('text=User Management')).toBeVisible();

    await page.fill('input[name="search"]', 'testuser');
    await page.click('button:has-text("Search")');

    await expect(page.locator('[data-testid="user-result"]')).toBeVisible();
  });
});

test.describe('Notification Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can view notifications', async ({ page }) => {
    await page.goto('/notifications');

    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test('user can mark notifications as read', async ({ page }) => {
    await page.goto('/notifications');

    await page.click('button:has-text("Mark All Read")');

    await expect(page.locator('text=All notifications marked as read')).toBeVisible();
  });
});

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('user can search for content', async ({ page }) => {
    await page.goto('/search');

    await page.fill('input[name="query"]', 'comedy');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="search-result"]')).toBeVisible();
  });

  test('shows empty state for no results', async ({ page }) => {
    await page.goto('/search');

    await page.fill('input[name="query"]', 'nonexistent-content-xyz123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=No results found')).toBeVisible();
  });
});
