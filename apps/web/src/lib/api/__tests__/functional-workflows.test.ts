import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthMethods } from '../auth';
import { createContentMethods } from '../content';
import { createWalletMethods } from '../wallet';
import { createUserMethods } from '../user';
import { createPaymentMethods } from '../payment';
import { createCreatorMethods } from '../creator';
import { createEngagementMethods } from '../engagement';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

// ── Functional Workflow: Complete Auth Flow ─────────────────────────────────
describe('Functional Workflow — Complete Authentication Flow', () => {
  let client: ReturnType<typeof createMockClient>;
  let auth: ReturnType<typeof createAuthMethods>;

  beforeEach(() => {
    client = createMockClient();
    auth = createAuthMethods(client);
  });

  it('should complete full registration → verify email → login flow', async () => {
    // Step 1: Register
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        user: { id: '1', email: 'new@user.com', name: 'New', role: 'user' },
      },
    });

    const regResult = await auth.register({
      displayName: 'New User',
      email: 'new@user.com',
      password: 'SecurePass123!',
    });
    expect(regResult.success).toBe(true);
    expect(regResult.data!.user.email).toBe('new@user.com');

    // Step 2: Verify email
    client.request.mockResolvedValueOnce({ success: true, data: { message: 'Email verified' } });

    const verifyResult = await auth.verifyEmail('verify-token-123');
    expect(verifyResult.success).toBe(true);

    // Step 3: Login
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'tok2',
        refresh_token: 'ref2',
        user: { id: '1', email: 'new@user.com', name: 'New', role: 'user' },
      },
    });

    const loginResult = await auth.login({ email: 'new@user.com', password: 'SecurePass123!' });
    expect(loginResult.success).toBe(true);
    expect(loginResult.data!.access_token).toBeDefined();
  });

  it('should complete password reset flow', async () => {
    // Step 1: Request reset
    client.request.mockResolvedValueOnce({ success: true, data: { message: 'Reset email sent' } });

    const forgotResult = await auth.requestPasswordReset('user@test.com');
    expect(forgotResult.success).toBe(true);

    // Step 2: Reset password with token
    client.request.mockResolvedValueOnce({ success: true, data: { message: 'Password reset' } });

    const resetResult = await auth.resetPassword('reset-token', 'NewSecurePass456!');
    expect(resetResult.success).toBe(true);

    // Step 3: Login with new password
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        user: { id: '1', email: 'user@test.com', name: 'User', role: 'user' },
      },
    });

    const loginResult = await auth.login({ email: 'user@test.com', password: 'NewSecurePass456!' });
    expect(loginResult.success).toBe(true);
  });

  it('should complete MFA verification flow', async () => {
    // Step 1: Login triggers MFA
    client.request.mockResolvedValueOnce({
      success: false,
      message: 'MFA required',
      statusCode: 403,
      code: 'MFA_REQUIRED',
    });

    const loginResult = await auth.login({ email: 'secure@user.com', password: 'pass' });
    expect(loginResult.success).toBe(false);

    // Step 2: Verify MFA code
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        user: { id: '1', email: 'secure@user.com', name: 'Secure', role: 'user' },
      },
    });

    const mfaResult = await auth.verifyMFA('123456');
    expect(mfaResult.success).toBe(true);
    expect(mfaResult.data!.access_token).toBeDefined();
  });

  it('should handle token refresh flow', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
    });

    const result = await auth.refreshToken('old-refresh');

    expect(result.success).toBe(true);
    expect(result.data!.access_token).toBe('new-access');
    expect(result.data!.refresh_token).toBe('new-refresh');
    // Verify retryOn401 is set for refresh requests
    expect(client.request).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
      retryOn401: true,
    });
  });
});

// ── Functional Workflow: Content Discovery & Consumption ───────────────────
describe('Functional Workflow — Content Discovery & Consumption', () => {
  let client: ReturnType<typeof createMockClient>;
  let content: ReturnType<typeof createContentMethods>;
  let user: ReturnType<typeof createUserMethods>;

  beforeEach(() => {
    client = createMockClient();
    content = createContentMethods(client);
    user = createUserMethods(client);
  });

  it('should complete browse → search → view → add to history flow', async () => {
    // Step 1: Browse featured content
    client.request.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'c1',
          title: 'Featured Movie',
          thumbnail: 'thumb.jpg',
          universeId: 'u1',
          status: 'published',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          creator: { id: 'cr1', name: 'Creator' },
          universe: { id: 'u1', name: 'Nollywood' },
        },
      ],
    });

    const featured = await content.getFeaturedContent();
    expect(featured.success).toBe(true);
    expect(featured.data!.length).toBeGreaterThan(0);

    // Step 2: Search for specific content
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'c2',
            title: 'Search Result',
            thumbnail: 'thumb.jpg',
            universeId: 'u1',
            status: 'published',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            creator: { id: 'cr1', name: 'Creator' },
            universe: { id: 'u1', name: 'Nollywood' },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      },
    });

    const searchResults = await content.searchContent({ query: 'Nollywood', sortBy: 'popular' });
    expect(searchResults.success).toBe(true);
    expect(searchResults.data!.items.length).toBeGreaterThan(0);

    // Step 3: View content details
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'c2',
        title: 'Search Result',
        description: 'A great movie',
        thumbnail: 'thumb.jpg',
        universeId: 'u1',
        status: 'published',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        creator: { id: 'cr1', name: 'Creator' },
        universe: { id: 'u1', name: 'Nollywood' },
      },
    });

    const contentDetail = await content.getContent('c2');
    expect(contentDetail.success).toBe(true);
    expect(contentDetail.data!.id).toBe('c2');

    // Step 4: Get signed URL for playback
    client.request.mockResolvedValueOnce({
      success: true,
      data: { signedUrl: 'https://signed.example.com/video.mp4', expiresIn: 3600 },
    });

    const signedUrl = await content.getSignedUrl('c2');
    expect(signedUrl.success).toBe(true);
    expect(signedUrl.data!.signedUrl).toContain('https://');

    // Step 5: Add to watch history
    client.request.mockResolvedValueOnce({ success: true, data: { message: 'Added' } });

    const historyResult = await user.addToWatchHistory('c2');
    expect(historyResult.success).toBe(true);

    // Step 6: Get related content
    client.request.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'c3', title: 'Related Movie' }],
    });

    const related = await content.getRelatedContent('c2');
    expect(related.success).toBe(true);
  });

  it('should complete universe browsing flow', async () => {
    // Step 1: Get all content for a universe
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'c1',
            title: 'Movie 1',
            thumbnail: 't.jpg',
            universeId: 'u1',
            status: 'published',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            creator: { id: 'cr1', name: 'C' },
            universe: { id: 'u1', name: 'Nollywood' },
          },
        ],
        total: 100,
        page: 1,
        limit: 20,
        hasMore: true,
      },
    });

    const universeContent = await content.getContentByUniverse('nollywood', 1, 20);
    expect(universeContent.success).toBe(true);
    expect(universeContent.data!.hasMore).toBe(true);

    // Step 2: Paginate to page 2
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        items: [{ id: 'c21', title: 'Movie 21' }],
        total: 100,
        page: 2,
        limit: 20,
        hasMore: true,
      },
    });

    const page2 = await content.getContentByUniverse('nollywood', 2, 20);
    expect(page2.success).toBe(true);
    expect(page2.data!.page).toBe(2);
  });
});

// ── Functional Workflow: Creator Content Management ────────────────────────
describe('Functional Workflow — Creator Content Management', () => {
  let client: ReturnType<typeof createMockClient>;
  let creator: ReturnType<typeof createCreatorMethods>;
  let content: ReturnType<typeof createContentMethods>;

  beforeEach(() => {
    client = createMockClient();
    creator = createCreatorMethods(client);
    content = createContentMethods(client);
  });

  it('should complete creator dashboard → my content → delete flow', async () => {
    // Step 1: View creator dashboard stats
    client.request.mockResolvedValueOnce({
      success: true,
      data: { totalViews: 50000, totalEarnings: 15000, totalContent: 25 },
    });

    const stats = await creator.getStats();
    expect(stats.success).toBe(true);

    // Step 2: View my content
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          { id: 'c1', title: 'My Video', status: 'published' },
          { id: 'c2', title: 'Draft Video', status: 'draft' },
        ],
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false,
      },
    });

    const myContent = await content.getMyContent({ status: 'published' });
    expect(myContent.success).toBe(true);
    expect(myContent.data!.items).toHaveLength(2);

    // Step 3: Delete content
    client.request.mockResolvedValueOnce({ success: true, data: { message: 'Deleted' } });

    const deleteResult = await content.deleteContent('c2');
    expect(deleteResult.success).toBe(true);
  });

  it('should complete creator analytics review flow', async () => {
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        views: 50000,
        earnings: 15000,
        subscribers: 1200,
        topContent: [{ id: 'c1', title: 'Popular Video', views: 10000 }],
      },
    });

    const analytics = await creator.getAnalytics({ range: '30d' });

    expect(analytics.success).toBe(true);
  });
});

// ── Functional Workflow: Wallet & Payments ─────────────────────────────────
describe('Functional Workflow — Wallet & Payments', () => {
  let client: ReturnType<typeof createMockClient>;
  let wallet: ReturnType<typeof createWalletMethods>;
  let payment: ReturnType<typeof createPaymentMethods>;

  beforeEach(() => {
    client = createMockClient();
    wallet = createWalletMethods(client);
    payment = createPaymentMethods(client);
  });

  it('should complete fund wallet → check balance → view transactions flow', async () => {
    // Step 1: Initialize payment to fund wallet
    client.request.mockResolvedValueOnce({
      success: true,
      data: { reference: 'pay-ref-123', authorizationUrl: 'https://paystack.com/xyz' },
    });

    const initResult = await payment.initialize({
      amount: 5000,
      currency: 'NGN',
      email: 'user@test.com',
    });
    expect(initResult.success).toBe(true);
    expect(initResult.data!.reference).toBe('pay-ref-123');

    // Step 2: Verify payment
    client.request.mockResolvedValueOnce({
      success: true,
      data: { status: 'success', amount: 5000, currency: 'NGN', reference: 'pay-ref-123' },
    });

    const verifyResult = await payment.verify('pay-ref-123');
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.data!.status).toBe('success');

    // Step 3: Check updated balance
    client.request.mockResolvedValueOnce({
      success: true,
      data: { balance: 5000, currency: 'NGN', pendingBalance: 0 },
    });

    const balance = await wallet.getBalance();
    expect(balance.success).toBe(true);
    expect(balance.data!.balance).toBe(5000);

    // Step 4: View transaction history
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'tx1',
            type: 'credit',
            amount: 5000,
            currency: 'NGN',
            status: 'completed',
            createdAt: '2026-07-01',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      },
    });

    const transactions = await wallet.getTransactions();
    expect(transactions.success).toBe(true);
    expect(transactions.data!.items).toHaveLength(1);
    expect(transactions.data!.items[0].type).toBe('credit');
  });

  it('should complete transfer flow', async () => {
    client.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'Transfer successful' },
    });

    const result = await wallet.transfer(500, 'recipient-user-id');

    expect(result.success).toBe(true);
    expect(client.request).toHaveBeenCalledWith(
      '/api/v1/wallet/transfer',
      expect.objectContaining({ method: 'POST' })
    );
    const transferBody = JSON.parse(client.request.mock.calls[0][1].body);
    expect(transferBody).toEqual({
      amount: 500,
      recipientId: 'recipient-user-id',
      idempotencyKey: expect.any(String),
    });
  });

  it('should complete withdrawal flow', async () => {
    client.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'Withdrawal initiated' },
    });

    const result = await wallet.withdraw(2000, { bankCode: '058', accountNumber: '0123456789' });

    expect(result.success).toBe(true);
    expect(client.request).toHaveBeenCalledWith(
      '/api/v1/wallet/withdraw',
      expect.objectContaining({ method: 'POST' })
    );
    const withdrawBody = JSON.parse(client.request.mock.calls[0][1].body);
    expect(withdrawBody).toEqual({
      amount: 2000,
      bankDetails: { bankCode: '058', accountNumber: '0123456789' },
      idempotencyKey: expect.any(String),
    });
  });
});

// ── Functional Workflow: User Profile Management ───────────────────────────
describe('Functional Workflow — User Profile Management', () => {
  let client: ReturnType<typeof createMockClient>;
  let user: ReturnType<typeof createUserMethods>;

  beforeEach(() => {
    client = createMockClient();
    user = createUserMethods(client);
  });

  it('should complete profile view → update → verify flow', async () => {
    // Step 1: View current profile
    client.request.mockResolvedValueOnce({
      success: true,
      data: { id: 'u1', email: 'user@test.com', name: 'User', role: 'user' },
    });

    const profile = await user.getProfile();
    expect(profile.success).toBe(true);
    expect(profile.data!.email).toBe('user@test.com');

    // Step 2: Update profile
    client.request.mockResolvedValueOnce({
      success: true,
      data: { id: 'u1', email: 'user@test.com', name: 'Updated Name', role: 'user' },
    });

    const updateResult = await user.updateProfile({ displayName: 'Updated Name' });
    expect(updateResult.success).toBe(true);

    // Step 3: Update preferences
    client.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'Preferences updated' },
    });

    const prefResult = await user.updatePreferences({ theme: 'dark', notifications: true });
    expect(prefResult.success).toBe(true);
  });

  it('should complete watch history management flow', async () => {
    // Step 1: Check empty history
    client.request.mockResolvedValueOnce({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
    });

    const emptyHistory = await user.getWatchHistory();
    expect(emptyHistory.success).toBe(true);
    expect(emptyHistory.data!.items).toEqual([]);

    // Step 2: Add to history
    client.request.mockResolvedValueOnce({ success: true, data: { message: 'Added' } });

    const addResult = await user.addToWatchHistory('c1');
    expect(addResult.success).toBe(true);

    // Step 3: Check history with content
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            id: 'c1',
            title: 'Watched Movie',
            status: 'published',
            thumbnail: 'thumb.jpg',
            universeId: 'u1',
            createdAt: '2026-07-01',
            updatedAt: '2026-07-01',
            creator: { id: 'cr1', name: 'Creator' },
            universe: { id: 'u1', name: 'Nollywood' },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      },
    });

    const history = await user.getWatchHistory();
    expect(history.success).toBe(true);
    expect(history.data!.items).toHaveLength(1);
  });
});

// ── Functional Workflow: Error Recovery ────────────────────────────────────
describe('Functional Workflow — Error Recovery', () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  it('should handle graceful degradation when API is unavailable', async () => {
    const content = createContentMethods(client);
    const engagement = createEngagementMethods(client);

    // Featured content fails
    client.request.mockResolvedValueOnce({
      success: false,
      message: 'Service unavailable',
      statusCode: 503,
    });

    const featured = await content.getFeaturedContent();
    expect(featured.success).toBe(false);

    // Trending also fails
    client.request.mockResolvedValueOnce({
      success: false,
      message: 'Service unavailable',
      statusCode: 503,
    });

    const trending = await engagement.getContinueWatching();
    expect(trending.success).toBe(false);
  });

  it('should handle partial failure in multi-step operations', async () => {
    const wallet = createWalletMethods(client);
    const payment = createPaymentMethods(client);

    // Payment succeeds
    client.request.mockResolvedValueOnce({
      success: true,
      data: { reference: 'ref-123', authorizationUrl: 'https://pay.com' },
    });

    const initResult = await payment.initialize({
      amount: 1000,
      currency: 'NGN',
      email: 'a@b.com',
    });
    expect(initResult.success).toBe(true);

    // But verification fails
    client.request.mockResolvedValueOnce({
      success: false,
      message: 'Payment not found',
      statusCode: 404,
    });

    const verifyResult = await payment.verify('ref-123');
    expect(verifyResult.success).toBe(false);

    // Balance check still works
    client.request.mockResolvedValueOnce({ success: true, data: { balance: 0, currency: 'NGN' } });

    const balance = await wallet.getBalance();
    expect(balance.success).toBe(true);
  });

  it('should handle authentication failure and recovery', async () => {
    const auth = createAuthMethods(client);
    const user = createUserMethods(client);

    // Login fails
    client.request.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials',
      statusCode: 401,
    });

    const loginFail = await auth.login({ email: 'a@b.com', password: 'wrong' });
    expect(loginFail.success).toBe(false);

    // Profile access fails (no auth)
    client.request.mockResolvedValueOnce({
      success: false,
      message: 'Unauthorized',
      statusCode: 401,
    });

    const profileFail = await user.getProfile();
    expect(profileFail.success).toBe(false);

    // Retry login succeeds
    client.request.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'tok',
        refresh_token: 'ref',
        user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
      },
    });

    const loginSuccess = await auth.login({ email: 'a@b.com', password: 'correct' });
    expect(loginSuccess.success).toBe(true);

    // Profile now succeeds
    client.request.mockResolvedValueOnce({
      success: true,
      data: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
    });

    const profileSuccess = await user.getProfile();
    expect(profileSuccess.success).toBe(true);
  });
});
