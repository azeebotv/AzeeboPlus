import { CdnFlagPurgeQueueService } from './cdn-flag-purge-queue.service';
import { FeatureFlagService, mediaFlags } from '@azeebo/feature-flags';
import { CdnInvalidationQueueService } from './cdn-invalidation-queue.service';
import { ConfigService } from '@nestjs/config';

describe('CdnFlagPurgeQueueService', () => {
  let service: CdnFlagPurgeQueueService;

  const mockFeatureFlagService = {
    isEnabled: jest.fn(),
  };

  const mockInvalidationQueue = {
    enqueue: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    mockInvalidationQueue.enqueue.mockResolvedValue({ queued: true });
    mockConfigService.get.mockReturnValue(undefined);

    service = new CdnFlagPurgeQueueService(
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockInvalidationQueue as unknown as CdnInvalidationQueueService,
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

  it('does not enqueue when booting with the flag already off (first poll seeds state)', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(mediaFlags.cdnEdgeCache);
    expect(mockInvalidationQueue.enqueue).not.toHaveBeenCalled();
  });

  it('enqueues the uploads prefix once when the flag transitions on → off', async () => {
    // Seed: on. Next poll: off → transition.
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000);

    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledWith('uploads/*', 'flag-flip');
  });

  it('does not enqueue duplicate purges while the flag stays off', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(90_000); // three polls after seeding

    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);
  });

  it('enqueues again on a subsequent off flip after re-enabling', async () => {
    // on (seed) → off (enqueue #1) → on → off (enqueue #2)
    mockFeatureFlagService.isEnabled
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000);
    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(30_000); // re-enabled
    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(30_000); // off again
    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(2);
  });

  it('uses the env-configured poll interval', async () => {
    mockConfigService.get.mockReturnValue(10_000);
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);

    service = new CdnFlagPurgeQueueService(
      mockFeatureFlagService as unknown as FeatureFlagService,
      mockInvalidationQueue as unknown as CdnInvalidationQueueService,
      mockConfigService as unknown as ConfigService
    );
    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(10_000);

    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledTimes(2); // seed + tick
  });

  it('survives a flag-poll failure and retries next interval', async () => {
    mockFeatureFlagService.isEnabled
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('redis down'))
      .mockResolvedValue(false);

    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30_000); // poll fails, state stays true
    expect(mockInvalidationQueue.enqueue).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(30_000); // off detected now
    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);
  });

  it('logs but does not throw when the queue enqueue fails', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValueOnce(true).mockResolvedValue(false);
    mockInvalidationQueue.enqueue.mockRejectedValue(new Error('db down'));

    service.onModuleInit();
    await expect(jest.advanceTimersByTimeAsync(30_000)).resolves.not.toThrow();
    expect(mockInvalidationQueue.enqueue).toHaveBeenCalledTimes(1);
  });
});
