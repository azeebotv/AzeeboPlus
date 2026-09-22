import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadTtlSweeperService } from './upload-ttl-sweeper.service';
import { S3Service } from '../upload/s3.service';
import { BlobReconcileService } from './blob-reconcile.service';

describe('UploadTtlSweeperService', () => {
  let service: UploadTtlSweeperService;

  const mockS3 = {
    listAllObjects: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockReconcile = {
    collectReferences: jest.fn(),
  };

  const config: Record<string, number> = {};

  const mockConfig = {
    get: jest.fn((key: string) => config[key]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete config.MEDIA_UPLOAD_TTL_HOURS;

    const moduleRef = await Test.createTestingModule({
      providers: [
        UploadTtlSweeperService,
        { provide: S3Service, useValue: mockS3 },
        { provide: BlobReconcileService, useValue: mockReconcile },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = moduleRef.get<UploadTtlSweeperService>(UploadTtlSweeperService);
  });

  it('deletes uuid-keyed unreferenced objects past the TTL', async () => {
    const old = new Date(Date.now() - 30 * 3600 * 1000); // 30h old
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/aaaaaaaa-1111-4222-8333-444444444444.mp4', Size: 1000, LastModified: old },
    ]);
    mockReconcile.collectReferences.mockResolvedValue(new Set());
    mockS3.deleteFile.mockResolvedValue(undefined);

    const result = await service.sweep();

    expect(result.deleted).toHaveLength(1);
    expect(result.deleted[0].key).toBe('videos/aaaaaaaa-1111-4222-8333-444444444444.mp4');
    expect(result.deleted[0].ageHours).toBeGreaterThanOrEqual(29);
    expect(mockS3.deleteFile).toHaveBeenCalledWith('videos/aaaaaaaa-1111-4222-8333-444444444444.mp4');
  });

  it('spares young orphans inside the TTL window (reconcile handles those)', async () => {
    const fresh = new Date(Date.now() - 2 * 3600 * 1000); // 2h old
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/bbbbbbbb-1111-4222-8333-444444444444.mp4', Size: 10, LastModified: fresh },
    ]);
    mockReconcile.collectReferences.mockResolvedValue(new Set());

    const result = await service.sweep();

    expect(result.protectedYoung).toBe(1);
    expect(result.deleted).toHaveLength(0);
    expect(mockS3.deleteFile).not.toHaveBeenCalled();
  });

  it('spares referenced objects regardless of age', async () => {
    const old = new Date(Date.now() - 100 * 3600 * 1000);
    mockS3.listAllObjects.mockResolvedValue([
      // referenced via a CDN URL embedding the same uuid
      { Key: 'videos/cccccccc-1111-4222-8333-444444444444.mp4', Size: 20, LastModified: old },
    ]);
    mockReconcile.collectReferences.mockResolvedValue(
      new Set(['https://cdn.example.com/cccccccc-1111-4222-8333-444444444444/original.mp4'])
    );

    const result = await service.sweep();

    expect(result.protectedReferenced).toBe(1);
    expect(result.deleted).toHaveLength(0);
  });

  it('never touches keys without a leading uuid (unmanaged provenance)', async () => {
    const old = new Date(Date.now() - 100 * 3600 * 1000);
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/some-human-named-file.mp4', Size: 5, LastModified: old },
      { Key: 'readme.txt', Size: 1, LastModified: old },
    ]);
    mockReconcile.collectReferences.mockResolvedValue(new Set());

    const result = await service.sweep();

    expect(result.protectedUnmanaged).toBe(2);
    expect(mockS3.deleteFile).not.toHaveBeenCalled();
  });

  it('honours a custom TTL and reports per-object delete failures without aborting', async () => {
    config.MEDIA_UPLOAD_TTL_HOURS = 1;
    const ninetyMin = new Date(Date.now() - 1.5 * 3600 * 1000); // 1.5h: past 1h TTL, inside 24h
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/dddddddd-1111-4222-8333-444444444444.mp4', Size: 7, LastModified: ninetyMin },
      { Key: 'videos/eeeeeeee-1111-4222-8333-444444444444.mp4', Size: 9, LastModified: ninetyMin },
    ]);
    mockReconcile.collectReferences.mockResolvedValue(new Set());
    mockS3.deleteFile
      .mockRejectedValueOnce(new Error('NoSuchBucket: ghost'))
      .mockResolvedValueOnce(undefined);

    const result = await service.sweep();

    expect(result.errors).toEqual([
      { key: 'videos/dddddddd-1111-4222-8333-444444444444.mp4', reason: 'NoSuchBucket: ghost' },
    ]);
    expect(result.deleted).toEqual([
      expect.objectContaining({ key: 'videos/eeeeeeee-1111-4222-8333-444444444444.mp4' }),
    ]);
  });

  it('refuses to double-run while a sweep is in flight', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    mockS3.listAllObjects.mockReturnValue(
      gate.then(() => []) as never
    );
    mockReconcile.collectReferences.mockResolvedValue(new Set());

    const first = service.sweep();
    const second = await service.sweep();
    release();
    await first;

    expect(second.errors).toEqual([{ key: '*', reason: 'sweep already running' }]);
  });
});
