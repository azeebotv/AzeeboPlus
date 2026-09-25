import { Test } from '@nestjs/testing';
import { BlobReconcileService, type ReconcileResult } from './blob-reconcile.service';
import { PrismaService } from '../database/prisma.service';
import { S3Service } from '../upload/s3.service';

describe('BlobReconcileService', () => {
  let service: BlobReconcileService;

  const mockPrisma = {
    mediaUpload: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockS3 = {
    listAllObjects: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        BlobReconcileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3 },
      ],
    }).compile();

    service = moduleRef.get<BlobReconcileService>(BlobReconcileService);
  });

  it('inserts rows for bucket-only objects with reconciled metadata', async () => {
    const now = new Date('2026-09-17T09:00:00Z');
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/0f8d5a21-7c3e-4a9b-8a44-6f2fbd5a9101.mp4', Size: 7429, LastModified: now },
    ]);
    mockPrisma.mediaUpload.findMany.mockResolvedValue([]);
    mockPrisma.mediaUpload.create.mockResolvedValue({ id: 'm-new-1' });

    const result: ReconcileResult = await service.reconcile();

    expect(result.alreadyLinked).toBe(0);
    expect(result.linked).toHaveLength(1);
    expect(result.linked[0]).toMatchObject({ key: 'videos/0f8d5a21-7c3e-4a9b-8a44-6f2fbd5a9101.mp4', uploadId: 'm-new-1', size: 7429 });
    expect(mockPrisma.mediaUpload.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: 'videos/0f8d5a21-7c3e-4a9b-8a44-6f2fbd5a9101.mp4',
        status: 'uploaded',
        folder: 'videos',
        mimeType: 'video/mp4',
        metadata: expect.objectContaining({ reconciled: true }),
      }),
    });
  });

  it('skips objects whose key or uuid stem is already referenced', async () => {
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/0f8d5a21-7c3e-4a9b-8a44-6f2fbd5a9101.mp4', Size: 10, LastModified: new Date() },
      { Key: 'videos/11111111-2222-4333-8444-555555555555.mp4', Size: 20, LastModified: new Date() },
    ]);
    // First row stores the bare key; second stores only the uuid stem
    mockPrisma.mediaUpload.findMany.mockResolvedValue([
      { key: 'videos/0f8d5a21-7c3e-4a9b-8a44-6f2fbd5a9101.mp4' },
      { key: 'cdn.example.com/11111111-2222-4333-8444-555555555555/original.mp4' },
    ]);
    mockPrisma.mediaUpload.create.mockResolvedValue({ id: 'unused' });

    const result = await service.reconcile();

    expect(result.linked).toHaveLength(0);
    expect(result.alreadyLinked).toBe(2);
    expect(mockPrisma.mediaUpload.create).not.toHaveBeenCalled();
  });

  it('never inserts for zero-byte objects and reports per-row insert failures', async () => {
    mockS3.listAllObjects.mockResolvedValue([
      { Key: 'videos/22222222-3333-4444-8555-666666666666.mp4', Size: 0, LastModified: new Date() },
      { Key: 'videos/33333333-4444-4555-8666-777777777777.mp4', Size: 5, LastModified: new Date() },
    ]);
    mockPrisma.mediaUpload.findMany.mockResolvedValue([]);
    mockPrisma.mediaUpload.create.mockRejectedValueOnce(new Error('connection refused'));

    const result = await service.reconcile();

    expect(result.linked).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].key).toBe('videos/33333333-4444-4555-8666-777777777777.mp4');
    expect(result.errors[0].reason).toContain('connection refused');
  });
});
