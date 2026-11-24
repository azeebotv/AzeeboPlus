import { RewatchIdempotencyService } from './rewatch-idempotency.service';

describe('RewatchIdempotencyService', () => {
  let service: RewatchIdempotencyService;

  beforeEach(() => {
    RewatchIdempotencyService.clearStores();
    service = new RewatchIdempotencyService();
  });

  describe('recordWatch', () => {
    it('should record first watch and grant knowledge', async () => {
      const result = await service.recordWatch('user-1', 'content-1', 300, ['unit-1', 'unit-2']);

      expect(result.isFirstWatch).toBe(true);
      expect(result.watchCount).toBe(1);
      expect(result.knowledgeGranted).toEqual(['unit-1', 'unit-2']);
    });

    it('should not grant knowledge on rewatch by default', async () => {
      await service.recordWatch('user-1', 'content-1', 300, ['unit-1']);
      const result = await service.recordWatch('user-1', 'content-1', 300, ['unit-1']);

      expect(result.isFirstWatch).toBe(false);
      expect(result.watchCount).toBe(2);
      expect(result.knowledgeGranted).toEqual([]);
    });

    it('should track watch count', async () => {
      await service.recordWatch('user-1', 'content-1', 300);
      await service.recordWatch('user-1', 'content-1', 300);
      await service.recordWatch('user-1', 'content-1', 300);

      const record = await service.getRewatchRecord('user-1', 'content-1');

      expect(record?.watchCount).toBe(3);
    });

    it('should track total watch time', async () => {
      await service.recordWatch('user-1', 'content-1', 100);
      await service.recordWatch('user-1', 'content-1', 200);

      const record = await service.getRewatchRecord('user-1', 'content-1');

      expect(record?.totalWatchTimeSeconds).toBe(300);
    });
  });

  describe('hasWatched', () => {
    it('should return false for unwatched content', async () => {
      expect(await service.hasWatched('user-1', 'content-1')).toBe(false);
    });

    it('should return true for watched content', async () => {
      await service.recordWatch('user-1', 'content-1', 300);

      expect(await service.hasWatched('user-1', 'content-1')).toBe(true);
    });
  });

  describe('getWatchCount', () => {
    it('should return 0 for unwatched content', async () => {
      expect(await service.getWatchCount('user-1', 'content-1')).toBe(0);
    });

    it('should return correct watch count', async () => {
      await service.recordWatch('user-1', 'content-1', 300);
      await service.recordWatch('user-1', 'content-1', 300);

      expect(await service.getWatchCount('user-1', 'content-1')).toBe(2);
    });
  });

  describe('shouldGrantKnowledge', () => {
    it('should grant on first watch', () => {
      const result = service.shouldGrantKnowledge('user-1', 'content-1', 1);

      expect(result.grant).toBe(true);
      expect(result.reason).toBe('First watch');
    });

    it('should not grant on rewatch when disabled', () => {
      const result = service.shouldGrantKnowledge('user-1', 'content-1', 2);

      expect(result.grant).toBe(false);
      expect(result.reason).toContain('disabled');
    });

    it('should grant on rewatch when enabled', () => {
      const enabledService = new RewatchIdempotencyService({ grantKnowledgeOnRewatch: true });

      const result = enabledService.shouldGrantKnowledge('user-1', 'content-1', 2);

      expect(result.grant).toBe(true);
    });

    it('should reject when exceeding max watch count', () => {
      const enabledService = new RewatchIdempotencyService({
        grantKnowledgeOnRewatch: true,
        maxWatchCount: 10,
      });

      const result = enabledService.shouldGrantKnowledge('user-1', 'content-1', 11);

      expect(result.grant).toBe(false);
      expect(result.reason).toContain('max watch count');
    });
  });

  describe('getUserRewatchRecords', () => {
    it('should return all records for a user', async () => {
      await service.recordWatch('user-1', 'content-1', 300);
      await service.recordWatch('user-1', 'content-2', 300);
      await service.recordWatch('user-2', 'content-1', 300);

      const records = await service.getUserRewatchRecords('user-1');

      expect(records.length).toBe(2);
    });
  });
});
