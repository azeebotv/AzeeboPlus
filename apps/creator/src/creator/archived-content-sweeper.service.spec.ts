import { ArchivedContentSweeperService } from './archived-content-sweeper.service';

describe('ArchivedContentSweeperService', () => {
  let service: ArchivedContentSweeperService;

  const mockPrisma = {
    contentItem: {
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  const mockMediaClient = {
    deleteObject: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue(undefined),
  };

  const buildItem = (overrides: Record<string, unknown> = {}) => ({
    id: 'c-1',
    title: 'Old archive',
    metadata: { media: { key: 'videos/a.mp4', derivedKey: 'videos/a-preview.mp4' } },
    ...overrides,
  });

  beforeEach(async () => {
    // resetAllMocks (not clearAllMocks): unconsumed mockResolvedValueOnce
    // entries must NOT leak between tests — the defer tests break out of the
    // sweep loop before consuming their queued "end of data" return.
    jest.resetAllMocks();
    // Default: no env overrides → TTL 30d, interval default.
    mockConfig.get.mockReturnValue(undefined);
    mockPrisma.contentItem.update.mockResolvedValue({});
    // Default media outcome: object confirmed deleted (tests override).
    mockMediaClient.deleteObject.mockResolvedValue('deleted');

    const { Test } = jest.requireActual('@nestjs/testing');
    const moduleRef = await Test.createTestingModule({
      providers: [
        ArchivedContentSweeperService,
        { provide: PrismaServiceToken, useValue: mockPrisma },
        { provide: MediaClientToken, useValue: mockMediaClient },
        { provide: ConfigServiceToken, useValue: mockConfig },
      ],
    }).compile();

    service = moduleRef.get(ArchivedContentSweeperService);
  });

  it('purges stored objects for an item archived past the TTL and stamps mediaPurgedAt', async () => {
    const stale = new Date('2026-08-01T00:00:00Z'); // > 30d before Sep 17 2026
    mockPrisma.contentItem.findMany
      .mockResolvedValueOnce([buildItem({ archivedAt: stale })])
      .mockResolvedValueOnce([]); // loop end

    const result = await service.sweep();

    expect(result.scanned).toBe(1);
    expect(result.purged).toBe(1);
    expect(mockMediaClient.deleteObject).toHaveBeenCalledWith('videos/a.mp4');
    expect(mockMediaClient.deleteObject).toHaveBeenCalledWith('videos/a-preview.mp4');
    expect(mockPrisma.contentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c-1' },
        data: { mediaPurgedAt: expect.any(Date) },
      })
    );
  });

  it('defers and does NOT stamp when media-service fails to confirm a delete', async () => {
    mockPrisma.contentItem.findMany.mockResolvedValueOnce([buildItem()]).mockResolvedValueOnce([]);
    mockMediaClient.deleteObject.mockResolvedValue(null); // unreachable/refused

    const result = await service.sweep();

    expect(result.deferred).toBe(1);
    expect(result.purged).toBe(0);
    // Critical: no stamp, so the item is retried next pass.
    expect(mockPrisma.contentItem.update).not.toHaveBeenCalled();
  });

  it('marks permanently-done when media-service confirms the object was already gone', async () => {
    mockPrisma.contentItem.findMany.mockResolvedValueOnce([buildItem()]).mockResolvedValueOnce([]);
    mockMediaClient.deleteObject.mockResolvedValue('missing');

    const result = await service.sweep();

    expect(result.alreadyGone).toBe(1);
    expect(mockPrisma.contentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { mediaPurgedAt: expect.any(Date) } })
    );
  });

  it('stamps metadata-only items (no stored keys) without calling media-service', async () => {
    mockPrisma.contentItem.findMany
      .mockResolvedValueOnce([buildItem({ metadata: { upload: { size: 10 } } })])
      .mockResolvedValueOnce([]);

    const result = await service.sweep();

    expect(result.nothingStored).toBe(1);
    expect(mockMediaClient.deleteObject).not.toHaveBeenCalled();
    expect(mockPrisma.contentItem.update).toHaveBeenCalledTimes(1);
  });

  it('stops sweeping when a pass makes no progress (all deferred)', async () => {
    // Two batches worth of deferred items would otherwise loop forever.
    mockPrisma.contentItem.findMany.mockResolvedValue([
      buildItem({ id: 'c-1' }),
      buildItem({ id: 'c-2' }),
    ]);
    mockMediaClient.deleteObject.mockResolvedValue(null);

    const result = await service.sweep();

    // The no-progress guard breaks after the first batch.
    expect(result.deferred).toBe(2);
    expect(mockPrisma.contentItem.findMany).toHaveBeenCalledTimes(1);
  });

  it('skips overlapping runs while a sweep is already in progress', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((r) => (releaseFirst = r));
    let firstCall = true;
    mockPrisma.contentItem.findMany.mockImplementation(async () => {
      if (firstCall) {
        firstCall = false;
        await firstGate;
        return [];
      }
      return [];
    });

    const first = service.sweep();
    const second = await service.sweep();

    releaseFirst();
    await first;

    expect(second.scanned).toBe(0);
  });
});

// Tokens kept separate so the import stays at the top with real types.
import { PrismaService } from '../database/prisma.service';
const PrismaServiceToken = PrismaService;
import { MediaClientService } from '../api/clients/media-client.service';
const MediaClientToken = MediaClientService;
import { ConfigService } from '@nestjs/config';
const ConfigServiceToken = ConfigService;
