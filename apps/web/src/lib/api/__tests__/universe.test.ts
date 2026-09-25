import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUniverseMethods } from '../universe';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Universe API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let universe: ReturnType<typeof createUniverseMethods>;

  beforeEach(() => {
    client = createMockClient();
    universe = createUniverseMethods(client);
  });

  it('getUniverses should GET /api/v1/public/universes', async () => {
    const mockUniverses = [
      { id: 'movie', name: 'Movies', icon: 'Film', contentCount: 100 },
      { id: 'music', name: 'Music', icon: 'Music2', contentCount: 50 },
    ];
    client.request.mockResolvedValue({ success: true, data: mockUniverses });

    const result = await universe.getUniverses();

    expect(client.request).toHaveBeenCalledWith('/api/v1/public/universes');
    expect(result.data).toEqual(mockUniverses);
  });

  it('getUniverse should GET /api/v1/universe/:id', async () => {
    const mockUniverse = { id: 'movie', name: 'Movies', description: 'Films' };
    client.request.mockResolvedValue({ success: true, data: mockUniverse });

    const result = await universe.getUniverse('movie');

    expect(client.request).toHaveBeenCalledWith('/api/v1/universe/movie');
    expect(result.data).toEqual(mockUniverse);
  });
});
