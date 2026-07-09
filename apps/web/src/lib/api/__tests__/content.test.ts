import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createContentMethods } from '../content';
import type { RequestClient } from '../base';

function createMockClient(): RequestClient & { request: ReturnType<typeof vi.fn> } {
  return { request: vi.fn() };
}

describe('Content API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let content: ReturnType<typeof createContentMethods>;

  beforeEach(() => {
    client = createMockClient();
    content = createContentMethods(client);
  });

  describe('getContent', () => {
    it('should GET /api/v1/content/:id', async () => {
      const mockContent = { id: 'c1', title: 'Test', description: 'Desc', thumbnail: 'thumb.jpg', universeId: 'u1', status: 'published' as const, createdAt: '2024-01-01', updatedAt: '2024-01-01', creator: { id: 'u1', name: 'Creator' }, universe: { id: 'u1', name: 'Movies' } };
      client.request.mockResolvedValue({ success: true, data: mockContent });

      const result = await content.getContent('c1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/c1');
      expect(result.data).toEqual(mockContent);
    });
  });

  describe('getFeaturedContent', () => {
    it('should GET /api/v1/content/featured with default limit', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getFeaturedContent();

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/featured?limit=10');
    });

    it('should support custom limit', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getFeaturedContent(5);

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/featured?limit=5');
    });
  });

  describe('getTrendingContent', () => {
    it('should GET /api/v1/content/trending', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getTrendingContent();

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/trending?limit=10');
    });
  });

  describe('getContentByUniverse', () => {
    it('should GET /api/v1/content/universe/:id with pagination', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } });

      await content.getContentByUniverse('movie', 1, 20);

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/universe/movie?page=1&limit=20');
    });
  });

  describe('getContentByCategory', () => {
    it('should GET /api/v1/content/category/:id with pagination', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } });

      await content.getContentByCategory('cat1', 2, 10);

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/category/cat1?page=2&limit=10');
    });
  });

  describe('searchContent', () => {
    it('should build search params from filters', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } });

      await content.searchContent({ query: 'nollywood', universeId: 'movie', sortBy: 'popular', page: 1, limit: 10 });

      expect(client.request).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/content/search?')
      );
      const callUrl = client.request.mock.calls[0][0] as string;
      expect(callUrl).toContain('q=nollywood');
      expect(callUrl).toContain('universe=movie');
      expect(callUrl).toContain('sort=popular');
    });

    it('should handle empty filters', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } });

      await content.searchContent({});

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/search?');
    });

    it('should include tags as comma-separated', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0, page: 1, limit: 20, hasMore: false } });

      await content.searchContent({ tags: ['action', 'drama'] });

      const callUrl = client.request.mock.calls[0][0] as string;
      expect(callUrl).toContain('tags=action%2Cdrama');
    });
  });

  describe('getSignedUrl', () => {
    it('should GET /api/v1/content/:id/media/signed-url', async () => {
      client.request.mockResolvedValue({ success: true, data: { url: 'https://signed.example.com', expiresIn: 3600 } });

      await content.getSignedUrl('c1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/c1/media/signed-url');
    });
  });

  describe('deleteContent', () => {
    it('should DELETE /api/v1/content/:id', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Deleted' } });

      await content.deleteContent('c1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/c1', { method: 'DELETE' });
    });
  });

  describe('getCategories', () => {
    it('should GET /api/v1/content/categories', async () => {
      client.request.mockResolvedValue({ success: true, data: [{ id: 'cat1', name: 'Action' }] });

      await content.getCategories();

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/categories');
    });
  });

  describe('getContentById', () => {
    it('should GET /api/v1/content/:id', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: 'c1', title: 'Test' } });

      await content.getContentById('c1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/c1');
    });
  });

  describe('getRelatedContent', () => {
    it('should GET /api/v1/content/:id/related with default limit', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getRelatedContent('c1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/c1/related?limit=4');
    });

    it('should support custom limit', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getRelatedContent('c1', 8);

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/c1/related?limit=8');
    });
  });

  describe('getContentByCreator', () => {
    it('should GET /api/v1/content/creator/:id with default limit', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getContentByCreator('creator1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/creator/creator1?limit=3');
    });

    it('should support custom limit', async () => {
      client.request.mockResolvedValue({ success: true, data: [] });

      await content.getContentByCreator('creator1', 10);

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/creator/creator1?limit=10');
    });
  });

  describe('getMyContent', () => {
    it('should GET /api/v1/content/me with empty params', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0 } });

      await content.getMyContent();

      expect(client.request).toHaveBeenCalledWith('/api/v1/content/me?');
    });

    it('should include all params when provided', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0 } });

      await content.getMyContent({ limit: 10, offset: 5, contentType: 'video', status: 'published', sort: 'newest' });

      const callUrl = client.request.mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('offset=5');
      expect(callUrl).toContain('contentType=video');
      expect(callUrl).toContain('status=published');
      expect(callUrl).toContain('sort=newest');
    });
  });

  describe('searchContent advanced filters', () => {
    it('should include yearFrom and yearTo', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0 } });

      await content.searchContent({ yearFrom: 2020, yearTo: 2024 });

      const callUrl = client.request.mock.calls[0][0] as string;
      expect(callUrl).toContain('yearFrom=2020');
      expect(callUrl).toContain('yearTo=2024');
    });

    it('should include categoryId', async () => {
      client.request.mockResolvedValue({ success: true, data: { items: [], total: 0 } });

      await content.searchContent({ categoryId: 'cat1' });

      const callUrl = client.request.mock.calls[0][0] as string;
      expect(callUrl).toContain('category=cat1');
    });
  });
});
