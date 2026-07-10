import { contentApi } from '../content';
import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Mobile Content API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getContent should GET /v1/content/:id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { id: 'c1', title: 'Test' } } as any);

    await contentApi.getContent('c1');

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/c1');
  });

  it('getFeaturedContent should GET /v1/content/featured', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: [] } as any);

    await contentApi.getFeaturedContent(10);

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/featured?limit=10');
  });

  it('getTrendingContent should GET /v1/content/trending', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: [] } as any);

    await contentApi.getTrendingContent(20);

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/trending?limit=20');
  });

  it('getContentByUniverse should GET /v1/content/universe/:id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.getContentByUniverse('movie', 1, 20);

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/universe/movie?page=1&limit=20');
  });

  it('searchContent should build search params', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.searchContent({
      query: 'nollywood',
      universeId: 'movie',
      sortBy: 'popular',
      page: 1,
      limit: 10,
    });

    expect(mockedClient.get).toHaveBeenCalledWith(expect.stringContaining('/v1/content/search?'));
    const callUrl = mockedClient.get.mock.calls[0][0] as string;
    expect(callUrl).toContain('q=nollywood');
    expect(callUrl).toContain('universe=movie');
    expect(callUrl).toContain('sort=popular');
  });

  it('searchContent should handle empty filters', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.searchContent({});

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/search?');
  });

  it('searchContent should handle tags array', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.searchContent({ tags: ['action', 'drama'] });

    const callUrl = mockedClient.get.mock.calls[0][0] as string;
    expect(callUrl).toContain('tags=action%2Cdrama');
  });

  it('getContentByCategory should GET /v1/content/category/:id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.getContentByCategory('cat1', 2, 10);

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/category/cat1?page=2&limit=10');
  });

  it('getSignedUrl should GET /v1/content/:id/media/signed-url', async () => {
    mockedClient.get.mockResolvedValue({
      success: true,
      data: { url: 'https://signed.example.com' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await contentApi.getSignedUrl('c1');

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/content/c1/media/signed-url');
  });
});
