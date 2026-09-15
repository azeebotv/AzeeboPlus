import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthMethods } from '../auth';
import { createContentMethods } from '../content';
import { createWalletMethods } from '../wallet';
import { createPaymentMethods } from '../payment';
import { createUniverseMethods } from '../universe';
import { createCreatorMethods } from '../creator';
import { createEngagementMethods } from '../engagement';
import { createRealityMethods } from '../reality';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

// ── Response Shape Validation ──────────────────────────────────────────────
// Verifies that the API layer correctly passes through the response envelope
// { success, data?, message?, error?, statusCode? } and that the data shapes
// match what consuming code expects.

describe('Response Schema — Auth', () => {
  let client: ReturnType<typeof createMockClient>;
  let auth: ReturnType<typeof createAuthMethods>;

  beforeEach(() => {
    client = createMockClient();
    auth = createAuthMethods(client);
  });

  it('login returns AuthResponse shape { access_token, refresh_token, user }', async () => {
    const data = {
      access_token: 'tok',
      refresh_token: 'ref',
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
    };
    client.request.mockResolvedValue({ success: true, data });

    const result = await auth.login({ email: 'a@b.com', password: 'pass' });

    expect(result.data).toHaveProperty('access_token');
    expect(result.data).toHaveProperty('refresh_token');
    expect(result.data).toHaveProperty('user');
    expect(result.data!.user).toHaveProperty('id');
    expect(result.data!.user).toHaveProperty('email');
    expect(result.data!.user).toHaveProperty('name');
    expect(result.data!.user).toHaveProperty('role');
  });

  it('register returns AuthResponse shape', async () => {
    const data = {
      access_token: 'tok',
      refresh_token: 'ref',
      user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
    };
    client.request.mockResolvedValue({ success: true, data });

    const result = await auth.register({ displayName: 'Test', email: 'a@b.com', password: 'pass' });

    expect(result.data).toHaveProperty('access_token');
    expect(result.data).toHaveProperty('refresh_token');
    expect(result.data).toHaveProperty('user');
  });

  it('refreshToken returns { access_token, refresh_token }', async () => {
    const data = { access_token: 'new-tok', refresh_token: 'new-ref' };
    client.request.mockResolvedValue({ success: true, data });

    const result = await auth.refreshToken('old-ref');

    expect(result.data).toHaveProperty('access_token');
    expect(result.data).toHaveProperty('refresh_token');
  });
});

describe('Response Schema — Content', () => {
  let client: ReturnType<typeof createMockClient>;
  let content: ReturnType<typeof createContentMethods>;

  beforeEach(() => {
    client = createMockClient();
    content = createContentMethods(client);
  });

  it('getContent returns ContentItem shape', async () => {
    const data = {
      id: 'c1',
      title: 'Test Video',
      description: 'A test video',
      thumbnail: 'https://cdn.example.com/thumb.jpg',
      universeId: 'u1',
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      creator: { id: 'cr1', name: 'Creator' },
      universe: { id: 'u1', name: 'Nollywood' },
    };
    client.request.mockResolvedValue({ success: true, data });

    const result = await content.getContent('c1');

    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('title');
    expect(result.data).toHaveProperty('description');
    expect(result.data).toHaveProperty('thumbnail');
    expect(result.data).toHaveProperty('universeId');
    expect(result.data).toHaveProperty('status');
    expect(result.data).toHaveProperty('createdAt');
    expect(result.data).toHaveProperty('updatedAt');
    expect(result.data).toHaveProperty('creator');
    expect(result.data!.creator).toHaveProperty('id');
    expect(result.data!.creator).toHaveProperty('name');
    expect(result.data).toHaveProperty('universe');
    expect(result.data!.universe).toHaveProperty('id');
    expect(result.data!.universe).toHaveProperty('name');
  });

  it('searchContent returns PaginatedResponse shape', async () => {
    const data = {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
    client.request.mockResolvedValue({ success: true, data });

    const result = await content.searchContent({ query: 'test' });

    expect(result.data).toHaveProperty('items');
    expect(result.data).toHaveProperty('total');
    expect(result.data).toHaveProperty('page');
    expect(result.data).toHaveProperty('limit');
    expect(result.data).toHaveProperty('hasMore');
    expect(Array.isArray(result.data!.items)).toBe(true);
    expect(typeof result.data!.total).toBe('number');
    expect(typeof result.data!.page).toBe('number');
    expect(typeof result.data!.limit).toBe('number');
    expect(typeof result.data!.hasMore).toBe('boolean');
  });

  it('getCategories returns array of { id, name }', async () => {
    const data = [{ id: 'cat1', name: 'Action' }];
    client.request.mockResolvedValue({ success: true, data });

    const result = await content.getCategories();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data![0]).toHaveProperty('id');
    expect(result.data![0]).toHaveProperty('name');
  });
});

describe('Response Schema — Wallet', () => {
  let client: ReturnType<typeof createMockClient>;
  let wallet: ReturnType<typeof createWalletMethods>;

  beforeEach(() => {
    client = createMockClient();
    wallet = createWalletMethods(client);
  });

  it('getBalance returns { balance, currency }', async () => {
    const data = { balance: 5000, currency: 'NGN', pendingBalance: 200 };
    client.request.mockResolvedValue({ success: true, data });

    const result = await wallet.getBalance();

    expect(result.data).toHaveProperty('balance');
    expect(result.data).toHaveProperty('currency');
    expect(typeof result.data!.balance).toBe('number');
    expect(typeof result.data!.currency).toBe('string');
  });

  it('getTransactions returns PaginatedResponse of Transaction', async () => {
    const data = {
      items: [
        {
          id: 'tx1',
          type: 'credit',
          amount: 100,
          currency: 'NGN',
          status: 'completed',
          createdAt: '2026-01-01',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    };
    client.request.mockResolvedValue({ success: true, data });

    const result = await wallet.getTransactions();

    expect(result.data!.items[0]).toHaveProperty('id');
    expect(result.data!.items[0]).toHaveProperty('type');
    expect(result.data!.items[0]).toHaveProperty('amount');
    expect(result.data!.items[0]).toHaveProperty('currency');
    expect(result.data!.items[0]).toHaveProperty('status');
    expect(result.data!.items[0]).toHaveProperty('createdAt');
    expect(['credit', 'debit']).toContain(result.data!.items[0].type);
    expect(['pending', 'completed', 'failed']).toContain(result.data!.items[0].status);
  });


});

describe('Response Schema — Payment', () => {
  let client: ReturnType<typeof createMockClient>;
  let payment: ReturnType<typeof createPaymentMethods>;

  beforeEach(() => {
    client = createMockClient();
    payment = createPaymentMethods(client);
  });

  it('initialize returns { reference, authorizationUrl? }', async () => {
    const data = { reference: 'ref-123', authorizationUrl: 'https://paystack.com/xyz' };
    client.request.mockResolvedValue({ success: true, data });

    const result = await payment.initialize({ amount: 1000, currency: 'NGN', email: 'a@b.com' });

    expect(result.data).toHaveProperty('reference');
    expect(typeof result.data!.reference).toBe('string');
  });

  it('verify returns { status, amount, currency, reference }', async () => {
    const data = { status: 'success', amount: 1000, currency: 'NGN', reference: 'ref-123' };
    client.request.mockResolvedValue({ success: true, data });

    const result = await payment.verify('ref-123');

    expect(result.data).toHaveProperty('status');
    expect(result.data).toHaveProperty('amount');
    expect(result.data).toHaveProperty('currency');
    expect(result.data).toHaveProperty('reference');
    expect(['success', 'failed', 'pending']).toContain(result.data!.status);
  });
});

describe('Response Schema — Universe', () => {
  let client: ReturnType<typeof createMockClient>;
  let universe: ReturnType<typeof createUniverseMethods>;

  beforeEach(() => {
    client = createMockClient();
    universe = createUniverseMethods(client);
  });

  it('getUniverses returns array of Universe', async () => {
    const data = [
      {
        id: 'u1',
        name: 'nollywood',
        description: 'Nigerian cinema',
        icon: 'Film',
        contentCount: 150,
      },
    ];
    client.request.mockResolvedValue({ success: true, data });

    const result = await universe.getUniverses();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data![0]).toHaveProperty('id');
    expect(result.data![0]).toHaveProperty('name');
  });
});

describe('Response Schema — Creator', () => {
  let client: ReturnType<typeof createMockClient>;
  let creator: ReturnType<typeof createCreatorMethods>;

  beforeEach(() => {
    client = createMockClient();
    creator = createCreatorMethods(client);
  });

  it('getCreator returns creator profile', async () => {
    const data = {
      id: 'cr1',
      name: 'Creator One',
      avatar: 'https://cdn.example.com/avatar.jpg',
      contentCount: 50,
    };
    client.request.mockResolvedValue({ success: true, data });

    const result = await creator.getCreator('cr1');

    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('name');
  });

  it('getAnalytics returns analytics overview', async () => {
    const data = { users: [], content: [], revenue: [] };
    client.request.mockResolvedValue({ success: true, data });

    const result = await creator.getAnalytics();

    expect(result.data).toHaveProperty('users');
    expect(result.data).toHaveProperty('content');
    expect(result.data).toHaveProperty('revenue');
  });
});

describe('Response Schema — Engagement', () => {
  let client: ReturnType<typeof createMockClient>;
  let engagement: ReturnType<typeof createEngagementMethods>;

  beforeEach(() => {
    client = createMockClient();
    engagement = createEngagementMethods(client);
  });

  it('getRecentlyWatched returns array', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await engagement.getRecentlyWatched();

    expect(Array.isArray(result.data)).toBe(true);
  });

  it('getContinueWatching returns array', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    const result = await engagement.getContinueWatching();

    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe('Response Schema — Reality', () => {
  let client: ReturnType<typeof createMockClient>;
  let reality: ReturnType<typeof createRealityMethods>;

  beforeEach(() => {
    client = createMockClient();
    reality = createRealityMethods(client);
  });

  it('getContestants returns array of Contestant shape', async () => {
    const data = [
      {
        id: 'cont1',
        name: 'Contestant 1',
        avatar: 'https://cdn.example.com/c1.jpg',
        votes: 1500,
        status: 'safe',
      },
    ];
    client.request.mockResolvedValue({ success: true, data });

    const result = await reality.getContestants('show-1');

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data![0]).toHaveProperty('id');
    expect(result.data![0]).toHaveProperty('name');
    expect(result.data![0]).toHaveProperty('avatar');
    expect(result.data![0]).toHaveProperty('votes');
    expect(result.data![0]).toHaveProperty('status');
    expect(['safe', 'danger', 'eliminated']).toContain(result.data![0].status);
  });
});

// ── Error Response Schema ──────────────────────────────────────────────────
describe('Error Response Schema — consistent error envelope', () => {
  let client: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    client = createMockClient();
  });

  it('error responses have success: false and message', async () => {
    const auth = createAuthMethods(client);
    client.request.mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
      statusCode: 401,
    });

    const result = await auth.login({ email: 'a@b.com', password: 'wrong' });

    expect(result.success).toBe(false);
    expect(typeof result.message).toBe('string');
    expect(result.message!.length).toBeGreaterThan(0);
  });

  it('error responses include statusCode', async () => {
    const content = createContentMethods(client);
    client.request.mockResolvedValue({ success: false, message: 'Not found', statusCode: 404 });

    const result = await content.getContent('x');

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it('success responses have success: true and data', async () => {
    const wallet = createWalletMethods(client);
    client.request.mockResolvedValue({ success: true, data: { balance: 100, currency: 'NGN' } });

    const result = await wallet.getBalance();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
