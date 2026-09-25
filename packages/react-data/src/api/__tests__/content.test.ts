import { contentApi } from '../content';
import { apiClient } from '../client';

/** In-memory AsyncStorage mock — content.ts pulls media.ts (mediaCache) via
 * createContentWithFile, which imports AsyncStorage at module scope. */
const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
    getAllKeys: jest.fn(async () => Array.from(mockStore.keys())),
  },
}));

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    // media.ts (transitively imported) calls these at module scope.
    getBaseURL: jest.fn(() => 'http://test.local'),
    getToken: jest.fn(() => null),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Mobile Content API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getContentById should GET /api/v1/content/:id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { id: 'c1', title: 'Test' } } as any);

    await contentApi.getContentById('c1');

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/content/c1');
  });

  it('getFeaturedContent should GET /api/v1/content/featured', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: [] } as any);

    await contentApi.getFeaturedContent(10);

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/content/featured?limit=10');
  });

  it('getTrendingContent should GET /api/v1/content/trending', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: [] } as any);

    await contentApi.getTrendingContent(20);

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/content/trending?limit=20');
  });

  it('searchContent should build search params', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.searchContent('nollywood', 1, 10);

    expect(mockedClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/content/search?')
    );
    const callUrl = mockedClient.get.mock.calls[0][0] as string;
    expect(callUrl).toContain('q=nollywood');
    expect(callUrl).toContain('page=1');
    expect(callUrl).toContain('limit=10');
  });

  it('getContentByCategory should GET /api/v1/content/category/:id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.getContentByCategory('cat1', 2, 10);

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/content/category/cat1?page=2&limit=10');
  });

  it('getContentList should GET /api/v1/content', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.getContentList({ page: 1, limit: 20 });

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/content?page=1&limit=20');
  });

  it('getNewReleases should GET /api/v1/content/new-releases', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: [] } as any);

    await contentApi.getNewReleases(5);

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/content/new-releases?limit=5');
  });

  it('getWatchHistory should GET /api/v1/users/me/history', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await contentApi.getWatchHistory(1, 10);

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/users/me/history?page=1&limit=10');
  });
});
