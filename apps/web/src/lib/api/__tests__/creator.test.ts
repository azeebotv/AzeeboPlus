import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCreatorMethods } from '../creator';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Creator API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let creator: ReturnType<typeof createCreatorMethods>;

  beforeEach(() => {
    client = createMockClient();
    creator = createCreatorMethods(client);
  });

  it('getCreators should GET /api/v1/creators with pagination', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
    });

    await creator.getCreators(1, 20);

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators?page=1&limit=20');
  });

  it('getCreator should GET /api/v1/creators/:id', async () => {
    const mockCreator = {
      id: 'c1',
      name: 'Creator',
      email: 'c@b.com',
      role: 'creator' as const,
      contentCount: 10,
      subscriberCount: 100,
    };
    client.request.mockResolvedValue({ success: true, data: mockCreator });

    const result = await creator.getCreator('c1');

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators/c1');
    expect(result.data).toEqual(mockCreator);
  });

  it('getCreatorContent should GET /api/v1/creators/:id/content', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
    });

    await creator.getCreatorContent('c1', 1, 20);

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators/c1/content?page=1&limit=20');
  });

  it('getAnalytics should GET /api/v1/creators/analytics', async () => {
    client.request.mockResolvedValue({ success: true, data: { views: [] } });

    await creator.getAnalytics({ range: '30d' });

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators/analytics?range=30d');
  });

  it('getAnalytics should handle no params', async () => {
    client.request.mockResolvedValue({ success: true, data: {} });

    await creator.getAnalytics();

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators/analytics?');
  });

  it('getSettings should GET /api/v1/creators/settings', async () => {
    client.request.mockResolvedValue({ success: true, data: { emailNotifications: true } });

    await creator.getSettings();

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators/settings');
  });

  it('getStats should GET /api/v1/creators/stats', async () => {
    client.request.mockResolvedValue({ success: true, data: { totalViews: 1000 } });

    await creator.getStats();

    expect(client.request).toHaveBeenCalledWith('/api/v1/creators/stats');
  });
});
