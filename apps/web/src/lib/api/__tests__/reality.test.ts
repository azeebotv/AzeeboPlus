import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRealityMethods } from '../reality';
import type { RequestClient } from '../base';

function createMockClient(): RequestClient & { request: ReturnType<typeof vi.fn> } {
  return { request: vi.fn() };
}

describe('Reality API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let reality: ReturnType<typeof createRealityMethods>;

  beforeEach(() => {
    client = createMockClient();
    reality = createRealityMethods(client);
  });

  it('getContestants should GET /api/v1/reality/shows/:id/contestants', async () => {
    const mockContestants = [{ id: 'ct1', name: 'Contestant 1' }];
    client.request.mockResolvedValue({ success: true, data: mockContestants });

    const result = await reality.getContestants('show1');

    expect(client.request).toHaveBeenCalledWith('/api/v1/reality/shows/show1/contestants');
    expect(result.data).toEqual(mockContestants);
  });
});
