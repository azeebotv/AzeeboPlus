import { ImmutableAuditService, type ImmutableAuditEntry } from './immutable-audit.service';

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
        actorId: 'admin-1',
        actorRole: 'admin',
        action: 'test',
        resourceType: 'user',
        resourceId: 'u1',
        status: 'success',
      });
      await service.writeEntry({
        actorId: 'admin-2',
        actorRole: 'admin',
        action: 'test',
        resourceType: 'user',
        resourceId: 'u2',
        status: 'success',
      });

      const entries = await service.getEntries();
      expect(entries.length).toBe(2);
    });

    it('should filter by action', async () => {
      await service.writeEntry({
        actorId: 'a',
        actorRole: 'admin',
        action: 'user.suspend',
        resourceType: 'user',
        resourceId: 'u1',
        status: 'success',
      });
      await service.writeEntry({
        actorId: 'a',
        actorRole: 'admin',
        action: 'payment.refund',
        resourceType: 'payment',
        resourceId: 'p1',
        status: 'success',
      });

      const entries = await service.getEntries({ action: 'user.suspend' });
      expect(entries.length).toBe(1);
    });

    it('should filter by actorId', async () => {
      await service.writeEntry({
        actorId: 'admin-1',
        actorRole: 'admin',
        action: 'test',
        resourceType: 'user',
        resourceId: 'u1',
        status: 'success',
      });
      await service.writeEntry({
        actorId: 'admin-2',
        actorRole: 'admin',
        action: 'test',
        resourceType: 'user',
        resourceId: 'u2',
        status: 'success',
      });

      const entries = await service.getEntries({ actorId: 'admin-1' });
      expect(entries.length).toBe(1);
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify clean chain', async () => {
      await service.writeEntry({
        actorId: 'a',
        actorRole: 'admin',
        action: 'test',
        resourceType: 'user',
        resourceId: 'u1',
        status: 'success',
      });
      await service.writeEntry({
        actorId: 'b',
        actorRole: 'admin',
        action: 'test',
        resourceType: 'user',
        resourceId: 'u2',
        status: 'success',
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
        actorId: 'a',
        actorRole: 'admin',
        action: 'first',
        resourceType: 'user',
        resourceId: 'u1',
        status: 'success',
      });
      await service.writeEntry({
        actorId: 'b',
        actorRole: 'admin',
        action: 'second',
        resourceType: 'user',
        resourceId: 'u2',
        status: 'success',
      });

      const last = await service.getLastEntry();
      expect(last?.action).toBe('second');
    });
  });

  describe('pseudonymizeNetworkMetadata (AUD-48)', () => {
    let service: ImmutableAuditService;

    beforeEach(() => {
      ImmutableAuditService.clearStore();
      service = new ImmutableAuditService();
    });

    async function writeWithNetworkMetadata(ip: string, ua: string): Promise<ImmutableAuditEntry> {
      return service.writeEntry({
        actorId: 'admin-1',
        actorRole: 'admin',
        action: 'user.suspend',
        resourceType: 'user',
        resourceId: 'u1',
        ipAddress: ip,
        userAgent: ua,
        status: 'success',
      });
    }

    it('pseudonymizes stale entries without breaking the hash chain', async () => {
      const entry = await writeWithNetworkMetadata('203.0.113.7', 'UA-old');
      const cutoff = new Date(entry.timestamp.getTime() + 1000);

      const { compacted } = await service.pseudonymizeNetworkMetadata(cutoff);

      expect(compacted).toBe(1);
      expect(entry.ipAddress).toMatch(/^id_[0-9a-f]{12}$/);
      expect(entry.userAgent).toMatch(/^id_[0-9a-f]{12}$/);
      // The chain hash never covered ipAddress/userAgent, so it still verifies.
      expect(entry.hash).toBeDefined();
      await expect(service.verifyIntegrity()).resolves.toMatchObject({
        valid: true,
        totalEntries: 1,
      });
    });

    it('leaves entries inside the retention window untouched', async () => {
      const entry = await writeWithNetworkMetadata('198.51.100.4', 'UA-new');

      // Cutoff equals the entry's timestamp: `timestamp >= olderThan` is skipped.
      const { compacted } = await service.pseudonymizeNetworkMetadata(new Date(entry.timestamp));

      expect(compacted).toBe(0);
      expect(entry.ipAddress).toBe('198.51.100.4');
      expect(entry.userAgent).toBe('UA-new');
    });
  });
});
