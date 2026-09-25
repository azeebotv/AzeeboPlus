import { DataRetentionService } from './data-retention.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

const createMockFn = (impl?: AnyFn): jest.Mock => jest.fn(impl);

describe('DataRetentionService', () => {
  let service: DataRetentionService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-21'));

    mockDb = {
      user: {
        findMany: createMockFn().mockResolvedValue([]),
        update: createMockFn().mockResolvedValue(undefined),
        delete: createMockFn().mockResolvedValue(undefined),
        count: createMockFn().mockResolvedValue(0),
      },
      watchHistory: {
        findMany: createMockFn().mockResolvedValue([]),
        update: createMockFn().mockResolvedValue(undefined),
        delete: createMockFn().mockResolvedValue(undefined),
        count: createMockFn().mockResolvedValue(0),
      },
    };

    service = new DataRetentionService(mockDb);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getPolicy', () => {
    it('should return a known policy', () => {
      const policy = service.getPolicy('accountIdentity');
      expect(policy).toBeDefined();
      expect(policy?.classification).toBe('restricted');
      expect(policy?.retentionDays).toBe(365 * 7);
    });

    it('should return undefined for unknown policy', () => {
      expect(service.getPolicy('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllPolicies', () => {
    it('should return all 9 policies', () => {
      const policies = service.getAllPolicies();
      expect(Object.keys(policies)).toHaveLength(9);
      expect(policies.accountIdentity).toBeDefined();
      expect(policies.consentRecords).toBeDefined();
      expect(policies.watchProgress).toBeDefined();
      expect(policies.paymentReferences).toBeDefined();
      expect(policies.entitlementLedger).toBeDefined();
      expect(policies.rewardLedger).toBeDefined();
      expect(policies.analyticsEvents).toBeDefined();
      expect(policies.adminAudit).toBeDefined();
      expect(policies.mediaDerivatives).toBeDefined();
    });
  });

  describe('enforceAccountIdentityRetention', () => {
    it('should anonymize inactive accounts', async () => {
      mockDb.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'old@test.com', displayName: 'Old User' },
        { id: 'user-2', email: 'also@test.com', displayName: 'Also Old' },
      ]);

      const result = await service.enforceRetention('accountIdentity');

      expect(result.totalRecords).toBe(2);
      expect(result.recordsAnonymized).toBe(2);
      expect(mockDb.user.update).toHaveBeenCalledTimes(2);
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          email: 'anonymized_user-1@deleted.local',
          displayName: 'Deleted User',
        }),
      });
    });

    it('should handle zero inactive accounts', async () => {
      mockDb.user.findMany.mockResolvedValue([]);

      const result = await service.enforceRetention('accountIdentity');
      expect(result.totalRecords).toBe(0);
      expect(result.recordsAnonymized).toBe(0);
    });
  });

  describe('enforceWatchProgressRetention', () => {
    it('should anonymize old watch progress', async () => {
      mockDb.watchHistory.findMany.mockResolvedValue([{ id: 'wh-1', userId: 'user-1' }]);

      const result = await service.enforceRetention('watchProgress');

      expect(result.totalRecords).toBe(1);
      expect(result.recordsAnonymized).toBe(1);
      expect(mockDb.watchHistory.update).toHaveBeenCalledWith({
        where: { id: 'wh-1' },
        data: expect.objectContaining({ userId: 'anonymized' }),
      });
    });
  });

  describe('legal retention policies', () => {
    it('should skip consent records (legal retention)', async () => {
      const result = await service.enforceRetention('consentRecords');
      expect(result.notes).toContain('retained per legal');
    });

    it('should skip payment references (legal retention)', async () => {
      const result = await service.enforceRetention('paymentReferences');
      expect(result.notes).toContain('retained per financial');
    });

    it('should skip admin audit (legal retention)', async () => {
      const result = await service.enforceRetention('adminAudit');
      expect(result.notes).toContain('retained per security');
    });
  });

  describe('handleErasureRequest', () => {
    it('should categorize data types by erasure eligibility', async () => {
      const result = await service.handleErasureRequest('user-1');

      expect(result.anonymized).toContain('accountIdentity');
      expect(result.anonymized).toContain('watchProgress');
      expect(result.retained).toContain('consentRecords');
      expect(result.retained).toContain('paymentReferences');
      expect(mockDb.user.update).toHaveBeenCalled();
    });
  });

  describe('enforceRetention', () => {
    it('should throw for unknown data type', async () => {
      await expect(service.enforceRetention('unknown')).rejects.toThrow(
        'Unknown data type: unknown'
      );
    });
  });

  describe('enforceAllRetention', () => {
    it('should enforce all policies', async () => {
      const results = await service.enforceAllRetention();
      expect(results).toHaveLength(9);
      expect(results.every((r) => r.dataType)).toBe(true);
    });
  });
});
