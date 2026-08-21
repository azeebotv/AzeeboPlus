import { ImmutableAuditService } from './immutable-audit.service';

describe('ImmutableAuditService', () => {
  let service: ImmutableAuditService;

  beforeEach(() => {
    ImmutableAuditService.clearStore();
    service = new ImmutableAuditService();
  });

  describe('writeEntry', () => {
    it('should write an audit entry with hash chain', async () => {
      const entry = await service.writeEntry({
        actorId: 'admin-1',
        actorRole: 'admin',
        action: 'user.suspend',
        resourceType: 'user',
        resourceId: 'user-123',
        status: 'success',
      });

      expect(entry.id).toBeDefined();
      expect(entry.sequenceNumber).toBe(1);
      expect(entry.hash).toBeDefined();
      expect(entry.hash.length).toBe(64); // SHA-256 hex
      expect(entry.previousHash).toBe('0'.repeat(64));
    });

    it('should chain hashes sequentially', async () => {
      const e1 = await service.writeEntry({
        actorId: 'admin-1',
        actorRole: 'admin',
        action: 'user.suspend',
        resourceType: 'user',
        resourceId: 'user-1',
        status: 'success',
      });

      const e2 = await service.writeEntry({
        actorId: 'admin-2',
        actorRole: 'admin',
        action: 'payment.refund',
        resourceType: 'payment',
        resourceId: 'pay-1',
        status: 'success',
      });

      expect(e2.previousHash).toBe(e1.hash);
      expect(e2.sequenceNumber).toBe(2);
    });
  });

  describe('getEntries', () => {
    it('should return all entries', async () => {
      await service.writeEntry({
        actorId: 'admin-1', actorRole: 'admin', action: 'test',
        resourceType: 'user', resourceId: 'u1', status: 'success',
      });
      await service.writeEntry({
        actorId: 'admin-2', actorRole: 'admin', action: 'test',
        resourceType: 'user', resourceId: 'u2', status: 'success',
      });

      const entries = await service.getEntries();
      expect(entries.length).toBe(2);
    });

    it('should filter by action', async () => {
      await service.writeEntry({
        actorId: 'a', actorRole: 'admin', action: 'user.suspend',
        resourceType: 'user', resourceId: 'u1', status: 'success',
      });
      await service.writeEntry({
        actorId: 'a', actorRole: 'admin', action: 'payment.refund',
        resourceType: 'payment', resourceId: 'p1', status: 'success',
      });

      const entries = await service.getEntries({ action: 'user.suspend' });
      expect(entries.length).toBe(1);
    });

    it('should filter by actorId', async () => {
      await service.writeEntry({
        actorId: 'admin-1', actorRole: 'admin', action: 'test',
        resourceType: 'user', resourceId: 'u1', status: 'success',
      });
      await service.writeEntry({
        actorId: 'admin-2', actorRole: 'admin', action: 'test',
        resourceType: 'user', resourceId: 'u2', status: 'success',
      });

      const entries = await service.getEntries({ actorId: 'admin-1' });
      expect(entries.length).toBe(1);
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify clean chain', async () => {
      await service.writeEntry({
        actorId: 'a', actorRole: 'admin', action: 'test',
        resourceType: 'user', resourceId: 'u1', status: 'success',
      });
      await service.writeEntry({
        actorId: 'b', actorRole: 'admin', action: 'test',
        resourceType: 'user', resourceId: 'u2', status: 'success',
      });

      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should verify empty chain', async () => {
      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.totalEntries).toBe(0);
    });
  });

  describe('getLastEntry', () => {
    it('should return the most recent entry', async () => {
      await service.writeEntry({
        actorId: 'a', actorRole: 'admin', action: 'first',
        resourceType: 'user', resourceId: 'u1', status: 'success',
      });
      await service.writeEntry({
        actorId: 'b', actorRole: 'admin', action: 'second',
        resourceType: 'user', resourceId: 'u2', status: 'success',
      });

      const last = await service.getLastEntry();
      expect(last?.action).toBe('second');
    });
  });
});
