import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthMethods } from '../auth';
import { createContentMethods } from '../content';
import { createWalletMethods } from '../wallet';
import { createUserMethods } from '../user';
import { createPaymentMethods } from '../payment';
import { createUniverseMethods } from '../universe';
import { createCreatorMethods } from '../creator';
import { createRecommendationMethods } from '../recommendation';
import { createModerationMethods } from '../moderation';
import { createEngagementMethods } from '../engagement';
import { createRealityMethods } from '../reality';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

// ── Auth Edge Cases ────────────────────────────────────────────────────────
describe('Auth — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let auth: ReturnType<typeof createAuthMethods>;

  beforeEach(() => {
    client = createMockClient();
    auth = createAuthMethods(client);
  });

  it('should handle login with 401 — wrong credentials', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
      statusCode: 401,
    });

    const result = await auth.login({ email: 'user@test.com', password: 'wrong' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should handle login with 429 — rate limited', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Too many login attempts',
      statusCode: 429,
    });

    const result = await auth.login({ email: 'user@test.com', password: 'pass' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(429);
  });

  it('should handle registration with 409 — email already exists', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Email already registered',
      statusCode: 409,
      code: 'EMAIL_EXISTS',
    });

    const result = await auth.register({
      displayName: 'Test',
      email: 'existing@test.com',
      password: 'pass',
    });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(409);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).code).toBe('EMAIL_EXISTS');
  });

  it('should handle registration with 400 — weak password', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Password too weak',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });

    const result = await auth.register({ displayName: 'Test', email: 'a@b.com', password: '123' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
  });

  it('should handle password reset for non-existent email (no info leak)', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { message: 'If the email exists, a reset link has been sent' },
    });

    const result = await auth.requestPasswordReset('nonexistent@test.com');

    expect(result.success).toBe(true);
  });

  it('should handle expired reset token', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Reset token has expired',
      statusCode: 400,
    });

    const result = await auth.resetPassword('expired-token', 'newPass123!');

    expect(result.success).toBe(false);
    expect(result.message).toContain('expired');
  });

  it('should handle expired verification token', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Verification token expired',
      statusCode: 400,
    });

    const result = await auth.verifyEmail('expired-token');

    expect(result.success).toBe(false);
  });

  it('should handle invalid MFA code', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Invalid MFA code',
      statusCode: 401,
    });

    const result = await auth.verifyMFA('000000');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should handle refresh token with 401 — token revoked', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Refresh token revoked',
      statusCode: 401,
    });

    const result = await auth.refreshToken('revoked-refresh');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should handle logout failure gracefully', async () => {
    client.request.mockResolvedValue({ success: false, message: 'Server error', statusCode: 500 });

    const result = await auth.logout();

    expect(result.success).toBe(false);
  });
});

// ── Content Edge Cases ─────────────────────────────────────────────────────
describe('Content — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let content: ReturnType<typeof createContentMethods>;

  beforeEach(() => {
    client = createMockClient();
    content = createContentMethods(client);
  });

  it('should handle 404 for non-existent content', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Content not found',
      statusCode: 404,
    });

    const result = await content.getContent('nonexistent');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('should handle search with no results', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
    });

    const result = await content.searchContent({ query: 'xyznonexistent' });

    expect(result.success).toBe(true);
    expect(result.data!.items).toHaveLength(0);
    expect(result.data!.total).toBe(0);
  });

  it('should handle delete of unauthorized content (403)', async () => {
    client.request.mockResolvedValue({ success: false, message: 'Forbidden', statusCode: 403 });

    const result = await content.deleteContent('other-users-content');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it('should handle getFeaturedContent with 500 server error', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });

    const result = await content.getFeaturedContent();

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
  });

  it('should handle getSignedUrl for content without media', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'No media asset for this content',
      statusCode: 404,
    });

    const result = await content.getSignedUrl('c-no-media');

    expect(result.success).toBe(false);
  });

  it('should handle getRelatedContent returning empty array', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await content.getRelatedContent('c-unique');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle getContentByUniverse with invalid universe ID', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Universe not found',
      statusCode: 404,
    });

    const result = await content.getContentByUniverse('invalid-universe');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('should handle getMyContent with network error', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Network error. Please check your connection.',
    });

    const result = await content.getMyContent();

    expect(result.success).toBe(false);
    expect(result.message).toContain('Network error');
  });

  it('should handle searchContent with all filter combinations', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
    });

    await content.searchContent({
      query: 'test',
      universeId: 'u1',
      categoryId: 'cat1',
      tags: ['tag1', 'tag2'],
      yearFrom: 2020,
      yearTo: 2024,
      ratingFrom: 3,
      ratingTo: 5,
      sortBy: 'trending',
      page: 2,
      limit: 10,
    });

    const callUrl = client.request.mock.calls[0][0] as string;
    expect(callUrl).toContain('q=test');
    expect(callUrl).toContain('universe=u1');
    expect(callUrl).toContain('category=cat1');
    expect(callUrl).toContain('yearFrom=2020');
    expect(callUrl).toContain('yearTo=2024');
    expect(callUrl).toContain('sort=trending');
    expect(callUrl).toContain('page=2');
    expect(callUrl).toContain('limit=10');
  });
});

// ── Wallet Edge Cases ──────────────────────────────────────────────────────
describe('Wallet — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let wallet: ReturnType<typeof createWalletMethods>;

  beforeEach(() => {
    client = createMockClient();
    wallet = createWalletMethods(client);
  });

  it('should handle insufficient balance for withdrawal', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Insufficient balance',
      statusCode: 400,
      code: 'INSUFFICIENT_BALANCE',
    });

    const result = await wallet.withdraw(999999, { bankCode: '001', accountNumber: '1234567890' });

    expect(result.success).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).code).toBe('INSUFFICIENT_BALANCE');
  });

  it('should handle transfer to non-existent user', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Recipient not found',
      statusCode: 404,
    });

    const result = await wallet.transfer(100, 'nonexistent-user');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('should handle transfer to self', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Cannot transfer to yourself',
      statusCode: 400,
    });

    const result = await wallet.transfer(100, 'self-id');

    expect(result.success).toBe(false);
  });

  it('should handle fund wallet with payment gateway error', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Payment gateway error',
      statusCode: 502,
    });

    const result = await wallet.fundWallet(1000, 'card');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(502);
  });

  it('should handle getBalance with 401 unauthorized', async () => {
    client.request.mockResolvedValue({ success: false, message: 'Unauthorized', statusCode: 401 });

    const result = await wallet.getBalance();

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should handle getTransactions with large page number', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 999, limit: 20, hasMore: false },
    });

    const result = await wallet.getTransactions(999, 20);

    expect(result.success).toBe(true);
    expect(result.data!.items).toHaveLength(0);
  });

  it('should handle getEarnings with no earnings', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { totalEarnings: 0, pendingEarnings: 0, withdrawableBalance: 0 },
    });

    const result = await wallet.getEarnings({ range: '7d' });

    expect(result.success).toBe(true);
    expect(result.data!.totalEarnings).toBe(0);
  });
});

// ── User Edge Cases ────────────────────────────────────────────────────────
describe('User — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let user: ReturnType<typeof createUserMethods>;

  beforeEach(() => {
    client = createMockClient();
    user = createUserMethods(client);
  });

  it('should handle getProfile with 401', async () => {
    client.request.mockResolvedValue({ success: false, message: 'Unauthorized', statusCode: 401 });

    const result = await user.getProfile();

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(401);
  });

  it('should handle updateProfile with validation error', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Invalid display name',
      statusCode: 400,
    });

    const result = await user.updateProfile({ displayName: '' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
  });

  it('should handle updateProfile with 413 payload too large', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Avatar file too large',
      statusCode: 413,
    });

    const result = await user.updateProfile({ avatar: 'data:image/png;base64,...' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(413);
  });

  it('should handle empty watch history', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await user.getWatchHistory();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle addToWatchHistory with invalid content ID', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Content not found',
      statusCode: 404,
    });

    const result = await user.addToWatchHistory('invalid-id');

    expect(result.success).toBe(false);
  });

  it('should handle preferences update with 500', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });

    const result = await user.updatePreferences({ theme: 'dark' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
  });
});

// ── Payment Edge Cases ─────────────────────────────────────────────────────
describe('Payment — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let payment: ReturnType<typeof createPaymentMethods>;

  beforeEach(() => {
    client = createMockClient();
    payment = createPaymentMethods(client);
  });

  it('should handle payment initialization with 400 invalid amount', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Invalid amount',
      statusCode: 400,
    });

    const result = await payment.initialize({ amount: -100, currency: 'NGN', email: 'a@b.com' });

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(400);
  });

  it('should handle payment verification with expired reference', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Payment reference expired',
      statusCode: 400,
    });

    const result = await payment.verify('expired-ref');

    expect(result.success).toBe(false);
  });

  it('should handle payment verification with pending status', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { status: 'pending', amount: 1000, currency: 'NGN', reference: 'ref-1' },
    });

    const result = await payment.verify('ref-1');

    expect(result.success).toBe(true);
    expect(result.data!.status).toBe('pending');
  });

  it('should handle empty payment transactions', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
    });

    const result = await payment.getTransactions();

    expect(result.success).toBe(true);
    expect(result.data!.items).toHaveLength(0);
  });
});

// ── Universe Edge Cases ────────────────────────────────────────────────────
describe('Universe — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let universe: ReturnType<typeof createUniverseMethods>;

  beforeEach(() => {
    client = createMockClient();
    universe = createUniverseMethods(client);
  });

  it('should handle empty universe list', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await universe.getUniverses();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle getUniverse with 404', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Universe not found',
      statusCode: 404,
    });

    const result = await universe.getUniverse('nonexistent');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });
});

// ── Creator Edge Cases ─────────────────────────────────────────────────────
describe('Creator — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let creator: ReturnType<typeof createCreatorMethods>;

  beforeEach(() => {
    client = createMockClient();
    creator = createCreatorMethods(client);
  });

  it('should handle getCreator with 404', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Creator not found',
      statusCode: 404,
    });

    const result = await creator.getCreator('nonexistent');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('should handle getCreatorContent with empty results', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await creator.getCreatorContent('creator-no-content');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle getAnalytics with 403 forbidden', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Not a creator account',
      statusCode: 403,
    });

    const result = await creator.getAnalytics();

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it('should handle getCreators with server error', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });

    const result = await creator.getCreators();

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
  });
});

// ── Recommendation Edge Cases ──────────────────────────────────────────────
describe('Recommendation — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let recommendation: ReturnType<typeof createRecommendationMethods>;

  beforeEach(() => {
    client = createMockClient();
    recommendation = createRecommendationMethods(client);
  });

  it('should handle empty recommendations (cold start)', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await recommendation.getForYou();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle trending with 500', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });

    const result = await recommendation.getTrending();

    expect(result.success).toBe(false);
  });

  it('should handle crossUniverse with empty data', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await recommendation.getCrossUniverse();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});

// ── Moderation Edge Cases ──────────────────────────────────────────────────
describe('Moderation — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let moderation: ReturnType<typeof createModerationMethods>;

  beforeEach(() => {
    client = createMockClient();
    moderation = createModerationMethods(client);
  });

  it('should handle report for non-existent content', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Content not found',
      statusCode: 404,
    });

    const result = await moderation.reportContent('nonexistent', 'spam');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('should handle duplicate report', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Already reported',
      statusCode: 409,
    });

    const result = await moderation.reportContent('c1', 'spam');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(409);
  });
});

// ── Engagement Edge Cases ──────────────────────────────────────────────────
describe('Engagement — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let engagement: ReturnType<typeof createEngagementMethods>;

  beforeEach(() => {
    client = createMockClient();
    engagement = createEngagementMethods(client);
  });

  it('should handle empty recently watched', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await engagement.getRecentlyWatched();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle continue watching with server error', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    });

    const result = await engagement.getContinueWatching();

    expect(result.success).toBe(false);
  });

  it('should handle getPopularInRegion with empty results', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await engagement.getPopularInRegion();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle getPersonalizedRecommendations for new user', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await engagement.getPersonalizedRecommendations();

    expect(result.success).toBe(true);
  });

  it('should handle getFeaturedSlides with 500', async () => {
    client.request.mockResolvedValue({ success: false, message: 'Server error', statusCode: 500 });

    const result = await engagement.getFeaturedSlides();

    expect(result.success).toBe(false);
  });
});

// ── Reality Edge Cases ─────────────────────────────────────────────────────
describe('Reality — Edge Cases & Error Scenarios', () => {
  let client: ReturnType<typeof createMockClient>;
  let reality: ReturnType<typeof createRealityMethods>;

  beforeEach(() => {
    client = createMockClient();
    reality = createRealityMethods(client);
  });

  it('should handle getContestants with 404', async () => {
    client.request.mockResolvedValue({
      success: false,
      message: 'Show not found',
      statusCode: 404,
    });

    const result = await reality.getContestants('nonexistent');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('should handle empty contestants list', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await reality.getContestants('show-1');

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
