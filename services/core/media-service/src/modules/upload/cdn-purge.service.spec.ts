import { CdnPurgeService } from './cdn-purge.service';
import { ConfigService } from '@nestjs/config';
import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

const mockSend = jest.fn().mockResolvedValue({ Invalidation: { Id: 'invalidation-123' } });

jest.mock('@aws-sdk/client-cloudfront', () => ({
  CloudFrontClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  CreateInvalidationCommand: jest.fn(),
}));

const makeService = (config: Record<string, unknown>): CdnPurgeService =>
  new CdnPurgeService({
    get: jest.fn((key: string, defaultValue?: unknown) => config[key] ?? defaultValue),
  } as unknown as ConfigService);

describe('CdnPurgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ Invalidation: { Id: 'invalidation-123' } });
  });

  describe('with CloudFront configured', () => {
    const config = {
      CLOUDFRONT_DISTRIBUTION_ID: 'dist-abc123',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'AKIA...',
      AWS_SECRET_ACCESS_KEY: 'secret',
    };

    it('purges exact keys as single CloudFront paths', async () => {
      const service = makeService(config);

      const result = await service.purgeKeys(['uploads/abc.jpg', 'uploads/def.png']);

      expect(result).toEqual({ invalidationId: 'invalidation-123', purged: 2 });
      expect(CreateInvalidationCommand).toHaveBeenCalledWith({
        DistributionId: 'dist-abc123',
        InvalidationBatch: expect.objectContaining({
          Paths: {
            Quantity: 2,
            Items: ['/uploads/abc.jpg', '/uploads/def.png'],
          },
        }),
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('normalizes keys and dedupes', async () => {
      const service = makeService(config);

      await service.purgeKeys(['/uploads/a.jpg', 'uploads/a.jpg', '  ']);

      expect(CreateInvalidationCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          InvalidationBatch: expect.objectContaining({
            Paths: { Quantity: 1, Items: ['/uploads/a.jpg'] },
          }),
        })
      );
    });

    it('purges a prefix as a wildcard path', async () => {
      const service = makeService(config);

      const result = await service.purgePrefix('uploads/images');

      expect(result).toEqual({ invalidationId: 'invalidation-123', purged: 1 });
      expect(CreateInvalidationCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          InvalidationBatch: expect.objectContaining({
            Paths: { Quantity: 1, Items: ['/uploads/images/*'] },
          }),
        })
      );
    });

    it('returns purged 0 for empty input', async () => {
      const service = makeService(config);

      expect(await service.purgeKeys([])).toEqual({ purged: 0 });
      expect(await service.purgePrefix('   ')).toEqual({ purged: 0 });
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('without CloudFront configured (dev)', () => {
    it('no-ops and reports 0 purged', async () => {
      const service = makeService({});

      const result = await service.purgeKeys(['uploads/abc.jpg']);

      expect(result).toEqual({ purged: 0 });
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('on AWS failure', () => {
    it('propagates the error so ops sees the purge failed', async () => {
      const service = makeService({ CLOUDFRONT_DISTRIBUTION_ID: 'dist-abc123' });
      mockSend.mockRejectedValue(new Error('AccessDenied'));

      await expect(service.purgeKeys(['uploads/abc.jpg'])).rejects.toThrow('AccessDenied');
    });
  });
});
