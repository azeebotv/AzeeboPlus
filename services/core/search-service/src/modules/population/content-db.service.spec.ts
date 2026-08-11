import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ContentDbService, buildPopulationQuery } from './content-db.service.js';

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

const MockPool = Pool as jest.MockedClass<typeof Pool>;

describe('buildPopulationQuery', () => {
  it('joins categories through the m2m junction and resolves creator displayName', () => {
    const sql = buildPopulationQuery('cursor-1', 50);

    expect(sql).toContain('FROM content_items ci');
    expect(sql).toContain('JOIN universes u ON u.id = ci."universeId"');
    expect(sql).toContain('LEFT JOIN media_assets ma ON ma."contentItemId" = ci.id');
    expect(sql).toContain('LEFT JOIN "_CategoryToContentItem" j ON j."B" = ci.id');
    expect(sql).toContain('LEFT JOIN categories c ON c.id = j."A"');
    expect(sql).toContain('LEFT JOIN users usr ON usr.id = ci."creatorId"');
    expect(sql).toContain('usr."displayName" AS "creatorName"');
    expect(sql).toContain("array_agg(c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL)");
    expect(sql).toContain("ci.status = 'published'");
    expect(sql).toContain('ci.id > $1');
    expect(sql).toContain('ORDER BY ci.id');
    expect(sql).toContain('LIMIT $2');
  });
});

describe('ContentDbService', () => {
  let service: ContentDbService;
  let fakePool: { query: jest.Mock; end?: jest.Mock };

  const mockConfig = (url: string | undefined) => ({
    get: jest.fn((key: string) => (key === 'CONTENT_DATABASE_URL' ? url : undefined)),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fakePool = { query: jest.fn(), end: jest.fn().mockResolvedValue(undefined) };
    (MockPool as unknown as jest.Mock).mockImplementation(() => fakePool);
  });

  async function build(url: string | undefined): Promise<ContentDbService> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ContentDbService,
        { provide: ConfigService, useValue: mockConfig(url) },
      ],
    }).compile();
    return moduleRef.get(ContentDbService);
  }

  it('creates the pool lazily from CONTENT_DATABASE_URL and passes the page args', async () => {
    service = await build('postgresql://u:p@localhost:5432/azeebo_content');
    fakePool.query.mockResolvedValue({
      rows: [
        {
          id: 'c-1',
          title: 'First',
          description: null,
          thumbnail: 'thumb.jpg',
          status: 'published',
          viewCount: 10,
          creatorId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          universeId: 'u-1',
          universe: 'reality',
          duration: 3600,
          categories: ['Action'],
          creatorName: 'Demo Creator',
        },
      ],
    });

    const rows = await service.fetchPage('', 100);

    expect(MockPool).toHaveBeenCalledTimes(1);
    expect(MockPool).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: 'postgresql://u:p@localhost:5432/azeebo_content' })
    );
    expect(fakePool.query).toHaveBeenCalledWith(expect.any(String), ['', 100]);
    expect(rows[0].creatorName).toBe('Demo Creator');
    expect(rows[0].categories).toEqual(['Action']);
  });

  it('reuses the pool across pages', async () => {
    service = await build('postgresql://u:p@localhost:5432/azeebo_content');
    fakePool.query.mockResolvedValue({ rows: [] });

    await service.fetchPage('', 100);
    await service.fetchPage('c-9', 100);

    expect(MockPool).toHaveBeenCalledTimes(1);
  });

  it('throws a descriptive error when CONTENT_DATABASE_URL is unset', async () => {
    service = await build(undefined);

    await expect(service.fetchPage('', 100)).rejects.toThrow('CONTENT_DATABASE_URL is not set');
  });

  it('closes the pool on module destroy', async () => {
    service = await build('postgresql://u:p@localhost:5432/azeebo_content');
    fakePool.query.mockResolvedValue({ rows: [] });

    // Force pool creation, then destroy.
    await service.fetchPage('', 100);
    await service.onModuleDestroy();

    expect(fakePool.end).toHaveBeenCalled();
  });
});
