import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRecommendationMethods } from '../recommendation';
import type { RequestClient } from '../base';

function createMockClient(): RequestClient & { request: ReturnType<typeof vi.fn> } {
  return { request: vi.fn() };
}

describe('Recommendation API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let recommendation: ReturnType<typeof createRecommendationMethods>;

  beforeEach(() => {
    client = createMockClient();
    recommendation = createRecommendationMethods(client);
  });

  it('getForYou should GET /api/v1/recommendation/content with limit', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await recommendation.getForYou(10);

    expect(client.request).toHaveBeenCalledWith('/api/v1/recommendation/content?limit=10');
  });

  it('getForYou should use default limit', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await recommendation.getForYou();

    expect(client.request).toHaveBeenCalledWith('/api/v1/recommendation/content?limit=10');
  });

  it('getTrending should GET /api/v1/recommendation/trending', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await recommendation.getTrending(20);

    expect(client.request).toHaveBeenCalledWith('/api/v1/recommendation/trending?limit=20');
  });

  it('getCreators should GET /api/v1/recommendation/creators', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await recommendation.getCreators(10);

    expect(client.request).toHaveBeenCalledWith('/api/v1/recommendation/creators?limit=10');
  });

  it('getCrossUniverse should GET /api/v1/recommendation/cross-universe', async () => {
    client.request.mockResolvedValue({ success: true, data: [] });

    await recommendation.getCrossUniverse(5);

    expect(client.request).toHaveBeenCalledWith('/api/v1/recommendation/cross-universe?limit=5');
  });
});
