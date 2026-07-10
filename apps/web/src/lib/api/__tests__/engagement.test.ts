import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEngagementMethods } from '../engagement';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Engagement API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let engagement: ReturnType<typeof createEngagementMethods>;

  beforeEach(() => {
    client = createMockClient();
    engagement = createEngagementMethods(client);
  });

  it('getRecentlyWatched should GET /api/v1/users/me/history with limit and offset', async () => {
    client.request.mockResolvedValue({
      success: true,
      data: { items: [], total: 0, page: 1, limit: 10, hasMore: false },
    });

    await engagement.getRecentlyWatched(10, 0);

    expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/history?limit=10&offset=0');
  });

  it('getRecentlyWatched should use defaults', async () => {
    client.request.mockResolvedValue({ success: true, data: { items: [], total: 0 } });

    await engagement.getRecentlyWatched();

    expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/history?limit=10&offset=0');
  });

  it('getUniverseEngagement should GET /api/v1/users/me/universes', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getUniverseEngagement();

    expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/universes');
  });

  it('getContentByUniverse should GET /api/v1/content/universe/:id with sort', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getContentByUniverse('movie', 12);

    expect(client.request).toHaveBeenCalledWith(
      '/api/v1/content/universe/movie?limit=12&sort=trending'
    );
  });

  it('getNewReleases should GET /api/v1/content/new-releases', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getNewReleases(12);

    expect(client.request).toHaveBeenCalledWith('/api/v1/content/new-releases?limit=12');
  });

  it('getContinueWatching should GET /api/v1/users/me/continue-watching', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getContinueWatching(10);

    expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/continue-watching?limit=10');
  });

  it('getPopularInRegion should GET /api/v1/content/popular-region', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getPopularInRegion(12);

    expect(client.request).toHaveBeenCalledWith('/api/v1/content/popular-region?limit=12');
  });

  it('getPersonalizedRecommendations should GET /api/v1/recommendation/personalized', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getPersonalizedRecommendations();

    expect(client.request).toHaveBeenCalledWith('/api/v1/recommendation/personalized');
  });

  it('getFeaturedSlides should GET /api/v1/content/featured-slides', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await engagement.getFeaturedSlides(5);

    expect(client.request).toHaveBeenCalledWith('/api/v1/content/featured-slides?limit=5');
  });
});
