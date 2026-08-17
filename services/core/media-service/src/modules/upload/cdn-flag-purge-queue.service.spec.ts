import { CdnFlagPurgeQueueService } from './cdn-flag-purge-queue.service';
import { FeatureFlagService, mediaFlags } from '@azeebo/feature-flags';
import { CdnPurgeService } from './cdn-purge.service';
import { ConfigService } from '@nestjs/config';

describe('CdnFlagPurgeQueueService', () => {
  let service: CdnFlagPurgeQueueService;

  const mockFeatureFlagService = {
    isEnabled: jest.fn(),
  };

  const mockCdnPurgeService = {
    purgePrefix: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    mockCdnPurgeService.purgePrefix.mockResolvedValue({ purged: 1 });
    mockConfigService.get.mockReturnValue(undefined);

    service = new CdnFlagPurgeQueueService(
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockCdnPurgeService as unknown as CdnPurgeService,
      mockConfigService as unknown as ConfigService
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does not purge when booting with the flag already off (first poll seeds state)', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(mediaFlags.cdnEdgeCache);
    expect(mockCdnPurgeService.purgePrefix).not.toHaveBeenCalled();
  });

  it('purges the uploads prefix once when the flag transitions on → off', async () => {
    // Seed: on. Next poll: off → transition.
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(1);
    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledWith('uploads');
  });

  it('does not enqueue duplicate purges while the flag stays off', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(90_000); // three polls after seeding

    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(1);
  });

  it('purges again on a subsequent off flip after re-enabling', async () => {
    // on (seed) → off (purge #1) → on → off (purge #2)
    mockFeatureFlagService.isEnabled
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000);
    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(30_000); // re-enabled
    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(30_000); // off again
    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(2);
  });

  it('uses the env-configured poll interval', async () => {
    mockConfigService.get.mockReturnValue(10_000);
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    service = new CdnFlagPurgeQueueService(
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockCdnPurgeService as unknown as CdnPurgeService,
      mockConfigService as unknown as ConfigService
    );
    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(10_000);

    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(1);
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledTimes(2); // seed + tick
  });

  it('survives a flag-poll failure and retries next interval', async () => {
    mockFeatureFlagService.isEnabled
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('redis down'))
      .mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000); // poll fails, state stays true
    expect(mockCdnPurgeService.purgePrefix).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(30_000); // off detected now
    expect(mockCdnPurgeService.purgePrefix).toHaveBeenCalledTimes(1);
  });
});
