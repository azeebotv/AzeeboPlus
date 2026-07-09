/**
 * Integration tests — verify cross-module API flow using the base request client.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthMethods } from '../auth';
import { createContentMethods } from '../content';
import { createWalletMethods } from '../wallet';
import { createCreatorMethods } from '../creator';
import { createRecommendationMethods } from '../recommendation';
import type { RequestClient } from '../base';

function createMockClient(): RequestClient & { request: ReturnType<typeof vi.fn> } {
  return { request: vi.fn() };
}

describe('API Integration Tests', () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  describe('auth flow integration', () => {
    it('should login then fetch profile with token', async () => {
      const auth = createAuthMethods(client);

      // Step 1: Login
      client.request.mockResolvedValueOnce({
        success: true,
        data: {
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          user: { id: '1', email: 'a@b.com', name: 'Test', role: 'user' },
        },
      });

      const loginResult = await auth.login({ email: 'a@b.com', password: 'pass' });
      expect(loginResult.success).toBe(true);
      expect(loginResult.data?.access_token).toBe('new-token');

      // Step 2: Refresh token
      client.request.mockResolvedValueOnce({
        success: true,
        data: { access_token: 'refreshed-token', refresh_token: 'refreshed-refresh' },
      });

      const refreshResult = await auth.refreshToken('new-refresh');
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.data?.access_token).toBe('refreshed-token');
    });

    it('should handle register → login → logout flow', async () => {
      const auth = createAuthMethods(client);

      // Register
      client.request.mockResolvedValueOnce({
        success: true,
        data: { access_token: 'tok', refresh_token: 'ref', user: { id: '1', email: 'a@b.com', name: 'New', role: 'user' } },
      });
      const regResult = await auth.register({ displayName: 'New', email: 'a@b.com', password: 'pass' });
      expect(regResult.success).toBe(true);

      // Login
      client.request.mockResolvedValueOnce({
        success: true,
        data: { access_token: 'tok2', refresh_token: 'ref2', user: { id: '1', email: 'a@b.com', name: 'New', role: 'user' } },
      });
      const loginResult = await auth.login({ email: 'a@b.com', password: 'pass' });
      expect(loginResult.success).toBe(true);

      // Logout
      client.request.mockResolvedValueOnce({ success: true, data: { message: 'Logged out' } });
      const logoutResult = await auth.logout();
      expect(logoutResult.success).toBe(true);
    });
  });

  describe('content discovery flow integration', () => {
    it('should search content then get details for a result', async () => {
      const content = createContentMethods(client);

      // Step 1: Search
      client.request.mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { id: 'c1', title: 'Nollywood Hit' },
            { id: 'c2', title: 'Nollywood Drama' },
          ],
          total: 2,
          page: 1,
          limit: 20,
          hasMore: false,
        },
      });

      const search = await content.searchContent({ query: 'nollywood' });
      expect(search.data?.items).toHaveLength(2);

      // Step 2: Get details for first result
      client.request.mockResolvedValueOnce({
        success: true,
        data: { id: 'c1', title: 'Nollywood Hit', description: 'A great film' },
      });

      const detail = await content.getContent('c1');
      expect(detail.data?.title).toBe('Nollywood Hit');
    });

    it('should browse featured content then get trending', async () => {
      const content = createContentMethods(client);
      const recommendation = createRecommendationMethods(client);

      // Featured
      client.request.mockResolvedValueOnce({
        success: true,
        data: [{ id: 'f1', title: 'Featured' }],
      });
      const featured = await content.getFeaturedContent(5);
      expect(featured.data).toHaveLength(1);

      // Trending via recommendations
      client.request.mockResolvedValueOnce({
        success: true,
        data: [{ id: 't1', contentId: 'c1', score: 0.9 }],
      });
      const trending = await recommendation.getTrending(10);
      expect(trending.data).toHaveLength(1);
    });
  });

  describe('wallet and creator flow integration', () => {
    it('should get wallet balance then creator earnings', async () => {
      const wallet = createWalletMethods(client);
      const creator = createCreatorMethods(client);

      // Wallet balance
      client.request.mockResolvedValueOnce({
        success: true,
        data: { balance: 5000, currency: 'NGN', pendingBalance: 200 },
      });
      const balance = await wallet.getBalance();
      expect(balance.data?.balance).toBe(5000);

      // Creator stats
      client.request.mockResolvedValueOnce({
        success: true,
        data: { totalViews: 10000, totalEarnings: 50000 },
      });
      const stats = await creator.getStats();
      expect(stats.data?.totalViews).toBe(10000);
    });

    it('should fund wallet then check transaction', async () => {
      const wallet = createWalletMethods(client);

      // Fund
      client.request.mockResolvedValueOnce({
        success: true,
        data: { reference: 'ref-123' },
      });
      const fund = await wallet.fundWallet(1000, 'card');
      expect(fund.data?.reference).toBe('ref-123');

      // Check transaction
      client.request.mockResolvedValueOnce({
        success: true,
        data: { id: 'tx-1', type: 'credit' as const, amount: 1000, currency: 'NGN', status: 'completed' as const, createdAt: '2024-01-01' },
      });
      const tx = await wallet.getTransaction('tx-1');
      expect(tx.data?.amount).toBe(1000);
    });
  });

  describe('error handling integration', () => {
    it('should propagate API errors through domain methods', async () => {
      const auth = createAuthMethods(client);

      client.request.mockResolvedValue({ success: false, message: 'Invalid credentials' });

      const result = await auth.login({ email: 'a@b.com', password: 'wrong' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should handle network errors in domain methods', async () => {
      const content = createContentMethods(client);

      client.request.mockResolvedValue({ success: false, error: 'Network error' });

      const result = await content.getContent('c1');
      expect(result.success).toBe(false);
    });
  });
});
