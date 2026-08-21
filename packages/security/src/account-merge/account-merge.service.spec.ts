import { AccountMergeService } from './account-merge.service';

describe('AccountMergeService', () => {
  let service: AccountMergeService;

  beforeEach(() => {
    AccountMergeService.clearStore();
    service = new AccountMergeService();
  });

  describe('initiateMerge', () => {
    it('should create a merge request', async () => {
      const result = await service.initiateMerge('user-1', 'user-2', 'admin-1');
      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.primaryUserId).toBe('user-1');
      expect(result.secondaryUserId).toBe('user-2');
    });

    it('should reject merging account with itself', async () => {
      await expect(
        service.initiateMerge('user-1', 'user-1', 'admin-1'),
      ).rejects.toThrow('Cannot merge an account with itself');
    });

    it('should reject duplicate pending merge', async () => {
      await service.initiateMerge('user-1', 'user-2', 'admin-1');
      await expect(
        service.initiateMerge('user-1', 'user-3', 'admin-1'),
      ).rejects.toThrow('already pending');
    });
  });

  describe('executeMerge', () => {
    it('should execute merge and transfer data', async () => {
      const req = await service.initiateMerge('user-1', 'user-2', 'admin-1');

      const result = await service.executeMerge(
        req.id,
        async () => ['purchases', 'rewards'],
        async () => ['displayName'],
      );

      expect(result.status).toBe('completed');
      expect(result.transferredData).toEqual(['purchases', 'rewards']);
      expect(result.conflicts).toEqual(['displayName']);
    });

    it('should handle merge failure', async () => {
      const req = await service.initiateMerge('user-1', 'user-2', 'admin-1');

      await expect(
        service.executeMerge(
          req.id,
          async () => { throw new Error('DB connection failed'); },
          async () => [],
        ),
      ).rejects.toThrow('DB connection failed');

      const result = await service.getMergeRequest(req.id);
      expect(result.status).toBe('failed');
    });
  });

  describe('rollbackMerge', () => {
    it('should rollback a completed merge', async () => {
      const req = await service.initiateMerge('user-1', 'user-2', 'admin-1');
      await service.executeMerge(req.id, async () => ['data'], async () => []);

      const rolledBack = await service.rollbackMerge(req.id);
      expect(rolledBack.status).toBe('rolled_back');
    });

    it('should reject rollback of non-completed merge', async () => {
      const req = await service.initiateMerge('user-1', 'user-2', 'admin-1');
      await expect(service.rollbackMerge(req.id)).rejects.toThrow('Can only rollback completed');
    });
  });
});
