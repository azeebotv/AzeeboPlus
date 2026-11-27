import { test, expect } from '@playwright/test';
import path from 'path';

const MOCK_SUPERADMIN = {
  id: 'usr_superadmin_001',
  email: 'admin@azeebo.com',
  name: 'Super Admin',
  displayName: 'Super Admin',
  role: 'super_admin',
};

async function setupMockApi(page: import('@playwright/test').Page) {
  await page.addInitScript((user) => {
    localStorage.setItem('azeebo_admin_user', JSON.stringify(user));
    localStorage.setItem('azeebo_admin_user_token', 'mock_jwt_access_token');
    document.cookie = '_csrf=mock_csrf_token_123456789; path=/; SameSite=Lax';
    document.cookie = '_csrf_client=mock_csrf_token_123456789; path=/; SameSite=Lax';
  }, MOCK_SUPERADMIN);

  await page.route('**/api/v1/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_SUPERADMIN }),
    });
  });

  await page.route('**/api/v1/auth/csrf', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'X-CSRF-Token': 'mock_csrf_token_123456789' },
      contentType: 'application/json',
      body: JSON.stringify({ success: true, token: 'mock_csrf_token_123456789' }),
    });
  });

  await page.route('**/api/v1/admin/dashboard/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalUsers: 14200,
          dailyActiveUsers: 3850,
          totalContent: 320,
          totalViews: 850000,
          totalRevenue: 24500000,
          newUsers: 120,
        },
      }),
    });
  });

  await page.route('**/api/v1/admin/feature-flags**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/v1/admin/universes/feature-flags**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

test.describe('Admin Ecosystem Live Browser CRUD Pass', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
  });

  // 1. Content Management & Unpublish / Publish CRUD Flow
  test('Content Management: renders table, executes unpublish and publish without 403', async ({ page }) => {
    let unpublishCalled = false;
    let publishCalled = false;

    await page.route((url) => url.pathname === '/api/v1/admin/content', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: 'cnt00001-0000-0000-0000-000000000040',
                  title: 'Azeebo Originals: Epic Journey Episode 1',
                  status: 'published',
                  type: 'video',
                  category: 'Entertainment',
                  createdAt: '2026-09-10T12:00:00Z',
                  views: 12400,
                  rating: 4.8,
                  user: { displayName: 'Studio Azeebo', email: 'studio@azeebo.com' },
                },
                {
                  id: 'cnt00002-0000-0000-0000-000000000041',
                  title: 'Behind the Scenes Special',
                  status: 'draft',
                  type: 'video',
                  category: 'Documentary',
                  createdAt: '2026-09-12T10:00:00Z',
                  views: 0,
                  rating: 0,
                  user: { displayName: 'Creator X', email: 'creator@azeebo.com' },
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/v1/admin/content/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [{ id: 'cat-1', name: 'Entertainment' }] }),
      });
    });

    await page.route('**/api/v1/admin/content/tags', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [{ id: 'tag-1', name: 'Featured' }] }),
      });
    });

    await page.route('**/api/v1/admin/content/cnt00001-0000-0000-0000-000000000040/unpublish', async (route) => {
      expect(route.request().method()).toBe('POST');
      unpublishCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'cnt00001-0000-0000-0000-000000000040', status: 'draft' },
        }),
      });
    });

    await page.route('**/api/v1/admin/content/cnt00002-0000-0000-0000-000000000041/publish', async (route) => {
      expect(route.request().method()).toBe('POST');
      publishCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'cnt00002-0000-0000-0000-000000000041', status: 'published' },
        }),
      });
    });

    await page.goto('/content');
    await expect(page.locator('h1')).toContainText('Content Management');
    await expect(page.getByText('Azeebo Originals: Epic Journey Episode 1')).toBeVisible();

    // Click Unpublish
    const unpublishBtn = page.getByRole('button', { name: 'Unpublish' }).first();
    await expect(unpublishBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/unpublish') && r.request().method() === 'POST'),
      unpublishBtn.click(),
    ]);
    expect(unpublishCalled).toBe(true);

    // Click Publish on draft item
    const publishBtn = page.getByRole('button', { name: 'Publish', exact: true }).first();
    await expect(publishBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/publish') && r.request().method() === 'POST'),
      publishBtn.click(),
    ]);
    expect(publishCalled).toBe(true);

    await page.screenshot({ path: path.join(__dirname, 'screenshots/01-content-management.png') });
  });

  // 2. User Management (G1): Multi-select, Bulk Suspend, CSV Export
  test('User Management (G1): renders checkboxes, opens bulk suspend modal, and submits bulk suspend', async ({ page }) => {
    let bulkSuspendPayload: unknown = null;

    await page.route('**/api/v1/admin/users**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              users: [
                {
                  id: 'usr-001',
                  email: 'alice@example.com',
                  displayName: 'Alice Walker',
                  role: 'user',
                  status: 'active',
                  createdAt: '2026-08-01T00:00:00Z',
                },
                {
                  id: 'usr-002',
                  email: 'bob@example.com',
                  displayName: 'Bob Builder',
                  role: 'creator',
                  status: 'active',
                  createdAt: '2026-08-05T00:00:00Z',
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
              hasMore: false,
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/v1/admin/users/bulk/suspend', async (route) => {
      bulkSuspendPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { suspendedCount: 1, userIds: ['usr-001'] },
        }),
      });
    });

    await page.goto('/users');
    await expect(page.locator('h1')).toContainText('Users');
    await expect(page.getByText('alice@example.com')).toBeVisible();

    // Select first user's checkbox
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Verify "Suspend Selected (1)" appears
    const suspendBtn = page.getByRole('button', { name: /Suspend Selected \(1\)/ });
    await expect(suspendBtn).toBeVisible();
    await suspendBtn.click();

    // Modal appears
    await expect(page.getByText('Bulk Suspend 1 Users')).toBeVisible();
    await page.selectOption('select', '7');
    await page.locator('textarea[placeholder="Reason for suspension..."]').fill('Terms violation');

    // Submit suspension
    const confirmBtn = page.getByRole('button', { name: 'Confirm Suspension' });
    await confirmBtn.click();

    expect(bulkSuspendPayload).toEqual({
      ids: ['usr-001'],
      reason: 'Terms violation',
      durationDays: 7,
    });

    // Test Export CSV button
    const exportBtn = page.getByRole('button', { name: /Export/ });
    await expect(exportBtn).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, 'screenshots/02-users-bulk-suspend.png') });
  });

  // 3. Tipping & Platform Settings (G2)
  test('Tipping Settings (G2): renders tipping settings card, allows editing and submits config update', async ({ page }) => {
    let updatePayload: unknown = null;

    await page.route('**/api/v1/admin/ops/tipping**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overview: { totalTips: 540, totalVolume: 1250000, averageTip: 2314, topCreatorTips: 85000 },
            leaderboard: [],
            recentTips: [],
            tierDistribution: { bronze: 40, silver: 25, gold: 15, platinum: 5 },
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/ops/tipping-config', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              platformCommissionPct: 10,
              maxTipAmount: 500000,
              updatedAt: '2026-09-01T00:00:00Z',
            },
          }),
        });
      } else if (route.request().method() === 'PUT') {
        updatePayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: updatePayload,
          }),
        });
      }
    });

    await page.goto('/tipping');
    await expect(page.locator('h1')).toContainText('Tipping Dashboard');
    await expect(page.getByText('Platform Tipping Settings')).toBeVisible();

    // Click Edit Settings
    const editBtn = page.getByRole('button', { name: 'Edit Settings' });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit input fields
    const commissionInput = page.locator('input[type="number"]').first();
    await commissionInput.fill('15');

    const maxTipInput = page.locator('input[type="number"]').nth(1);
    await maxTipInput.fill('750000');

    // Click Save Settings
    const saveBtn = page.getByRole('button', { name: 'Save Settings' });
    await saveBtn.click();

    expect(updatePayload).toEqual({
      platformCommissionPct: 15,
      maxTipAmount: 750000,
    });

    await page.screenshot({ path: path.join(__dirname, 'screenshots/03-tipping-settings.png') });
  });

  // 4. Subscriptions & Promo Codes (G3)
  test('Subscriptions & Promo Codes (G3): tabs to promo codes, opens create modal, and submits promo code', async ({ page }) => {
    let createdPromo: unknown = null;

    await page.route('**/api/v1/admin/subscriptions/plans**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'plan-1',
                name: 'Standard Pass',
                price: 9.99,
                currency: 'USD',
                durationDays: 30,
                tier: 'standard',
                status: 'active',
                features: ['HD Video', 'Mobile & Web'],
              },
            ],
            total: 1,
            totalPages: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/subscriptions/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalSubscribers: 8500,
            activeSubscribers: 7200,
            monthlyRecurringRevenue: 72000,
            churnRate: 2.1,
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/subscriptions/promo-codes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'promo-001',
                code: 'WELCOME50',
                discountType: 'percentage',
                discountValue: 50,
                maxRedemptions: 500,
                redemptionsCount: 120,
                isActive: true,
                expiresAt: '2026-12-31T23:59:59Z',
                createdAt: '2026-09-01T00:00:00Z',
              },
            ],
          }),
        });
      } else if (route.request().method() === 'POST') {
        createdPromo = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'promo-002', ...(createdPromo as Record<string, unknown>) },
          }),
        });
      }
    });

    await page.goto('/subscriptions');
    await expect(page.locator('h1')).toContainText('Subscriptions');

    // Switch to Promo Codes tab
    const promoTab = page.getByRole('tab', { name: /Promo Codes/ });
    await expect(promoTab).toBeVisible();
    await promoTab.click();

    await expect(page.getByText('WELCOME50')).toBeVisible();

    // Click New Promo Code
    const createPromoBtn = page.getByRole('button', { name: 'New Promo Code' });
    await expect(createPromoBtn).toBeVisible();
    await createPromoBtn.click();

    // Fill Create Promo Code form
    await page.locator('input[placeholder="e.g. SUMMER50"]').fill('FALL2026');
    await page.locator('[role="dialog"] input[type="number"]').first().fill('25');
    await page.locator('input[placeholder="Unlimited"]').fill('200');

    // Submit modal form
    const submitBtn = page.locator('[role="dialog"] button', { hasText: 'Create Code' });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/promo-codes') && r.request().method() === 'POST'),
      submitBtn.click(),
    ]);

    expect(createdPromo).toMatchObject({
      code: 'FALL2026',
      discountValue: 25,
      maxUses: 200,
    });

    await page.screenshot({ path: path.join(__dirname, 'screenshots/04-subscriptions-promos.png') });
  });

  // 5. Payment Gateways & Webhook Logs (G4)
  test('Payment Gateways (G4): renders gateway list and expands webhook event logs', async ({ page }) => {
    await page.route('**/api/v1/admin/payment-gateways', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'stripe',
              provider: 'stripe',
              name: 'Stripe',
              isEnabled: true,
              mode: 'live',
              supportedCurrencies: ['USD', 'EUR', 'GBP'],
              transactionFeePct: 2.9,
              fixedFee: 0.3,
            },
            {
              id: 'paystack',
              provider: 'paystack',
              name: 'Paystack',
              isEnabled: true,
              mode: 'live',
              supportedCurrencies: ['NGN', 'GHS', 'KES'],
              transactionFeePct: 1.5,
              fixedFee: 100,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/admin/payment-gateways/stripe/webhooks**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'evt_001',
                provider: 'stripe',
                eventType: 'charge.successful',
                status: 'processed',
                reference: 'ch_3Nabc123',
                amount: 1999,
                currency: 'USD',
                createdAt: '2026-09-15T14:20:00Z',
              },
              {
                id: 'evt_002',
                provider: 'stripe',
                eventType: 'payment_intent.created',
                status: 'processed',
                reference: 'pi_3Nxyz456',
                amount: 2500,
                currency: 'USD',
                createdAt: '2026-09-15T14:18:00Z',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/payment-gateways');
    await expect(page.locator('h1')).toContainText('Payment Gateways');
    await expect(page.getByRole('heading', { name: 'Stripe' })).toBeVisible();

    // Click Webhooks toggle button
    const webhooksBtn = page.getByRole('button', { name: /Webhooks/ }).first();
    await expect(webhooksBtn).toBeVisible();
    await webhooksBtn.click();

    // Verify webhook logs render
    await expect(page.getByText('charge.successful')).toBeVisible();
    await expect(page.getByText('ch_3Nabc123')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, 'screenshots/05-payment-gateways-webhooks.png') });
  });

  // 6. Settings & Integration Test Connection (G5)
  test('Settings (G5): renders Integrations tab and triggers test connection', async ({ page }) => {
    let testCalled = false;

    await page.route((url) => url.pathname === '/api/v1/admin/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              key: 'integrations.stripe',
              value: 'configured',
              category: 'integrations',
              description: 'Stripe payment gateway',
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/admin/settings/config**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            platformName: 'Azeebo+',
            supportEmail: 'support@azeebo.com',
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/settings/integrations/stripe/test', async (route) => {
      testCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            provider: 'stripe',
            status: 'connected',
            latencyMs: 142,
          },
        }),
      });
    });

    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Settings');

    // Click Integrations tab
    const integrationsTab = page.getByRole('button', { name: /integrations/i });
    await expect(integrationsTab).toBeVisible();
    await integrationsTab.click();

    // Click "Ping Test" button for Stripe
    const testBtn = page.getByRole('button', { name: 'Ping Test' }).first();
    await expect(testBtn).toBeVisible();
    await testBtn.click();

    expect(testCalled).toBe(true);
    await expect(page.getByText('Connected (connected)')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, 'screenshots/06-settings-integrations.png') });
  });

  // 7. Support Helpdesk (G6)
  test('Support Helpdesk (G6): renders ticket metrics, list, opens detail drawer, and sends reply', async ({ page }) => {
    let replyPayload: unknown = null;

    await page.route('**/api/v1/admin/support/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { open: 12, inProgress: 8, resolved: 45, closed: 110 },
        }),
      });
    });

    await page.route('**/api/v1/admin/support/tickets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: 'tkt-001',
                subject: 'Subscription billing question regarding Creator Pass',
                status: 'open',
                priority: 'high',
                category: 'billing',
                createdAt: '2026-09-15T11:00:00Z',
                user: { displayName: 'John Doe', email: 'john@example.com' },
                messages: [
                  {
                    id: 'msg-1',
                    senderType: 'user',
                    senderName: 'John Doe',
                    body: 'I was charged twice on my card this month.',
                    createdAt: '2026-09-15T11:00:00Z',
                  },
                ],
              },
            ],
            total: 1,
            totalPages: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/support/tickets/tkt-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'tkt-001',
            subject: 'Subscription billing question regarding Creator Pass',
            status: 'open',
            priority: 'high',
            category: 'billing',
            createdAt: '2026-09-15T11:00:00Z',
            user: { displayName: 'John Doe', email: 'john@example.com' },
            messages: [
              {
                id: 'msg-1',
                senderType: 'user',
                senderName: 'John Doe',
                body: 'I was charged twice on my card this month.',
                createdAt: '2026-09-15T11:00:00Z',
              },
            ],
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/support/tickets/tkt-001/reply', async (route) => {
      replyPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'msg-2',
            senderType: 'agent',
            senderName: 'Support Team',
            body: replyPayload,
            createdAt: '2026-09-15T14:30:00Z',
          },
        }),
      });
    });

    await page.goto('/support');
    await expect(page.locator('h1')).toContainText('Support Helpdesk');
    await expect(page.getByText('Subscription billing question')).toBeVisible();

    // Click on the ticket to open drawer
    await page.getByText('Subscription billing question').click();

    // Verify conversation drawer opens
    await expect(page.getByText('I was charged twice on my card this month.')).toBeVisible();

    // Send a reply
    const replyInput = page.locator('input[placeholder="Type a response to the user..."]');
    await replyInput.fill('We are reviewing your duplicate transaction and issuing a refund.');

    const sendBtn = page.getByRole('button', { name: 'Send', exact: true });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/reply') && r.request().method() === 'POST'),
      sendBtn.click(),
    ]);

    expect(replyPayload).toEqual({
      body: 'We are reviewing your duplicate transaction and issuing a refund.',
    });

    await page.screenshot({ path: path.join(__dirname, 'screenshots/07-support-helpdesk.png') });
  });

  // 8. Financial Management & Payout Requests (G7)
  test('Financial Management (G7): renders payout requests, approves and rejects with modal', async ({ page }) => {
    let approveCalled = false;
    let rejectPayload: unknown = null;

    await page.route('**/api/v1/admin/wallets/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalBalance: 45000000,
            activeWallets: 1200,
            pendingPayouts: 350000,
            completedPayouts: 18000000,
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/wallets/payouts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                {
                  id: 'pay-001',
                  userId: 'usr-101',
                  amount: 125000,
                  currency: 'NGN',
                  method: 'bank_transfer',
                  status: 'pending',
                  createdAt: '2026-09-14T10:00:00Z',
                  user: { displayName: 'Kolawole Creator', email: 'kola@azeebo.com' },
                },
                {
                  id: 'pay-002',
                  userId: 'usr-102',
                  amount: 85000,
                  currency: 'NGN',
                  method: 'bank_transfer',
                  status: 'pending',
                  createdAt: '2026-09-14T11:00:00Z',
                  user: { displayName: 'Amaka Producer', email: 'amaka@azeebo.com' },
                },
              ],
              total: 2,
              page: 1,
              limit: 20,
            },
          }),
        });
      }
    });

    await page.route('**/api/v1/admin/wallets/payouts/pay-001/approve', async (route) => {
      approveCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'pay-001', status: 'approved' },
        }),
      });
    });

    await page.route('**/api/v1/admin/wallets/payouts/pay-002/reject', async (route) => {
      rejectPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'pay-002', status: 'rejected' },
        }),
      });
    });

    await page.goto('/financial');
    await expect(page.locator('h1')).toContainText('Financial Overview');
    await expect(page.getByText('Kolawole Creator')).toBeVisible();

    // Click Approve on first payout
    const approveBtn = page.getByRole('button', { name: 'Approve', exact: true }).first();
    await expect(approveBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/approve') && r.request().method() === 'PUT'),
      approveBtn.click(),
    ]);
    expect(approveCalled).toBe(true);

    // Click Reject on second payout
    const rejectBtn = page.getByRole('button', { name: 'Reject', exact: true }).nth(1);
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Fill reject explanation modal
    await expect(page.getByText('Reject Payout Request')).toBeVisible();
    await page.locator('textarea[placeholder*="Bank details mismatch"]').fill('Bank details mismatch');

    const confirmRejectBtn = page.getByRole('button', { name: 'Confirm Rejection' });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/reject') && r.request().method() === 'PUT'),
      confirmRejectBtn.click(),
    ]);

    expect(rejectPayload).toEqual({ reason: 'Bank details mismatch' });

    await page.screenshot({ path: path.join(__dirname, 'screenshots/08-financial-payouts.png') });
  });

  // 9. Full Navigation Pass Across Remaining Pages
  test('Complete Admin Route Pass: renders all other admin sections without runtime error', async ({ page }) => {
    const routesToVisit = [
      { url: '/', title: 'Dashboard' },
      { url: '/overview', title: 'Overview' },
      { url: '/content-review', title: 'Review Queue' },
      { url: '/creators', title: 'Creators' },
      { url: '/reality', title: 'Reality' },
      { url: '/universes', title: 'Universes' },
      { url: '/wallets', title: 'Wallets' },
      { url: '/engagement', title: 'Engagement' },
      { url: '/notifications', title: 'Notifications' },
      { url: '/announcements', title: 'Announcements' },
      { url: '/audit-logs', title: 'Audit Logs' },
      { url: '/reports', title: 'Reports' },
    ];

    for (const r of routesToVisit) {
      await page.goto(r.url);
      await expect(page.locator('body')).toBeVisible();
      // Ensure no error boundary crashed the page
      await expect(page.getByText('Something went wrong')).not.toBeVisible();
    }

    await page.screenshot({ path: path.join(__dirname, 'screenshots/09-full-navigation-pass.png') });
  });
});
