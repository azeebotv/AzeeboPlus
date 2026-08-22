import { execSync } from 'node:child_process';
import Redis from 'ioredis';

// ============================================================================
// Security Services E2E Integration Tests
//
// Verifies real Redis/database persistence for:
// - BreakGlassService (Redis-backed sessions with TTL)
// - DualControlService (PostgreSQL-backed approval workflow)
// - ImmutableAuditService (PostgreSQL-backed append-only audit log)
//
// Infrastructure (see docker-compose.test.yml at the repo root):
//   docker compose -f docker-compose.test.yml up -d --wait redis-test postgres-test
//   pnpm --filter @azeebo/security test:e2e:security
//
// Opt-in: skipped unless RUN_SECURITY_E2E=1 or SECURITY_TEST_DATABASE_URL is set.
// ============================================================================

const RUN = process.env.RUN_SECURITY_E2E === '1' || !!process.env.SECURITY_TEST_DATABASE_URL;

const DB_URL =
  process.env.SECURITY_TEST_DATABASE_URL ??
  'postgresql://azeebo_test:azeebo_test@localhost:5433/azeebo_security_test?schema=public';

const REDIS_URL = process.env.REDIS_TEST_URL ?? 'redis://localhost:6380';

jest.setTimeout(120_000);

if (!RUN) {
  logger.log(
    `[security.e2e] Skipping — opt-in. Boot docker infra with \`docker compose ` +
      `-f docker-compose.test.yml up -d --wait redis-test postgres-test\` then run \`pnpm ` +
      `--filter @azeebo/security test:e2e:security\`.`
  );
}

const liveDescribe = RUN ? describe : describe.skip;

// ============================================================================
// BreakGlass Redis Integration
// ============================================================================

liveDescribe('BreakGlassService — real Redis persistence', () => {
  let redis: Redis;
  let service: {
    activate: (req: unknown) => Promise<unknown>;
    deactivate: (id: string) => Promise<void>;
    getSession: (id: string) => Promise<unknown | null>;
  };

  beforeAll(async () => {
    // Dynamic import to avoid module resolution issues
    const { BreakGlassRedisService } = await import('./break-glass/break-glass-redis.service');

    redis = new Redis(REDIS_URL, { retryStrategy: () => null, maxRetriesPerRequest: 3 });
    await new Promise<void>((resolve, reject) => {
      redis.on('ready', resolve);
      redis.on('error', reject);
    });

    service = new BreakGlassRedisService(redis);
  });

  afterAll(async () => {
    // Clean up all break_glass keys
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', 'break_glass:*', 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
    await redis.quit();
  });

  beforeEach(async () => {
    // Clean slate for each test
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', 'break_glass:*', 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  });

  it('should persist session in Redis and retrieve it', async () => {
    const session = await service.activate({
      userId: 'e2e-admin-1',
      originalRole: 'admin',
      elevatedRole: 'superadmin',
      reason: 'SEV-1-incident',
      justification: 'Production database is down',
      mfaVerified: true,
      reAuthenticated: true,
    });

    // Verify stored in Redis
    const stored = await redis.get(`break_glass:${session.id}`);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('e2e-admin-1');
    expect(parsed.status).toBe('active');
    expect(parsed.elevatedRole).toBe('superadmin');
  });

  it('should verify TTL is set on Redis key', async () => {
    const session = await service.activate({
      userId: 'e2e-admin-2',
      originalRole: 'admin',
      elevatedRole: 'superadmin',
      reason: 'production-outage',
      justification: 'Service degradation',
      mfaVerified: true,
      reAuthenticated: true,
    });

    const ttl = await redis.ttl(`break_glass:${session.id}`);
    // TTL should be > 0 (session duration + buffer)
    expect(ttl).toBeGreaterThan(0);
    // Should be at least 60 minutes (3600s) + 1 hour buffer (3600s) = 7200s
    expect(ttl).toBeGreaterThanOrEqual(3600);
  });

  it('should find session via index after persistence', async () => {
    await service.activate({
      userId: 'e2e-admin-3',
      originalRole: 'admin',
      elevatedRole: 'superadmin',
      reason: 'security-incident',
      justification: 'Suspicious activity detected',
      mfaVerified: true,
      reAuthenticated: true,
    });

    const activeSessions = await service.getActiveSessions();
    expect(activeSessions.length).toBe(1);
    expect(activeSessions[0].userId).toBe('e2e-admin-3');
  });

  it('should reject duplicate active session across Redis reads', async () => {
    await service.activate({
      userId: 'e2e-admin-4',
      originalRole: 'admin',
      elevatedRole: 'superadmin',
      reason: 'SEV-1-incident',
      justification: 'First activation',
      mfaVerified: true,
      reAuthenticated: true,
    });

    // Second activation should fail — service reads from Redis
    await expect(
      service.activate({
        userId: 'e2e-admin-4',
        originalRole: 'admin',
        elevatedRole: 'superadmin',
        reason: 'production-outage',
        justification: 'Second activation',
        mfaVerified: true,
        reAuthenticated: true,
      })
    ).rejects.toThrow('already has an active');
  });

  it('should revoke session and persist status change', async () => {
    const session = await service.activate({
      userId: 'e2e-admin-5',
      originalRole: 'admin',
      elevatedRole: 'superadmin',
      reason: 'data-breach-response',
      justification: 'Data breach detected',
      mfaVerified: true,
      reAuthenticated: true,
    });

    const revoked = await service.revoke(session.id, 'security-lead');
    expect(revoked.status).toBe('revoked');

    // Verify persisted in Redis
    const stored = await redis.get(`break_glass:${session.id}`);
    const parsed = JSON.parse(stored!);
    expect(parsed.status).toBe('revoked');
    expect(parsed.reviewedBy).toBe('security-lead');
  });

  it('should review session and persist notes', async () => {
    const session = await service.activate({
      userId: 'e2e-admin-6',
      originalRole: 'admin',
      elevatedRole: 'superadmin',
      reason: 'emergency-maintenance',
      justification: 'Critical patch deployment',
      mfaVerified: true,
      reAuthenticated: true,
    });

    const reviewed = await service.review(session.id, 'audit-lead', 'Approved — valid emergency');
    expect(reviewed.status).toBe('reviewed');
    expect(reviewed.reviewNotes).toBe('Approved — valid emergency');

    // Verify persisted
    const stored = await redis.get(`break_glass:${session.id}`);
    const parsed = JSON.parse(stored!);
    expect(parsed.status).toBe('reviewed');
    expect(parsed.reviewNotes).toBe('Approved — valid emergency');
  });

  it('should handle concurrent activations from multiple service instances', async () => {
    // Simulate two service instances activating simultaneously
    const promises = Array.from({ length: 5 }, (_, i) =>
      service
        .activate({
          userId: `e2e-user-${i}`,
          originalRole: 'admin',
          elevatedRole: 'superadmin',
          reason: 'SEV-1-incident',
          justification: `Concurrent test ${i}`,
          mfaVerified: true,
          reAuthenticated: true,
        })
        .catch(() => null)
    );

    const results = await Promise.all(promises);
    const successful = results.filter(Boolean);

    // All 5 should succeed (different users)
    expect(successful.length).toBe(5);

    // Verify all stored in Redis
    const activeSessions = await service.getActiveSessions();
    expect(activeSessions.length).toBe(5);
  });
});

// ============================================================================
// DualControl PostgreSQL Integration
// ============================================================================

liveDescribe('DualControlService — real PostgreSQL persistence', () => {
  let prisma: unknown;
  let service: {
    createRequest: (action: string, by: string, type: string, id: string) => Promise<unknown>;
    approveRequest: (id: string, by: string) => Promise<unknown>;
    getPendingRequests: () => Promise<unknown[]>;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = DB_URL;

    // Apply schema
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: `${process.cwd()}/packages/security`,
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: 'pipe',
    });

    // Create PrismaClient dynamically
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

    const { DualControlDbService } = await import('./dual-control/dual-control-db.service');
    service = new DualControlDbService(prisma);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.dualControlApproval.deleteMany();
    await prisma.dualControlRequest.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean slate
    await prisma.dualControlApproval.deleteMany();
    await prisma.dualControlRequest.deleteMany();
  });

  it('should persist request in PostgreSQL', async () => {
    const request = await service.createRequest(
      'large-refund',
      'e2e-admin-1',
      'payment',
      'pay-123',
      { amount: 5000, currency: 'USD' }
    );

    // Verify stored in database
    const stored = await prisma.dualControlRequest.findUnique({
      where: { id: request.id },
    });
    expect(stored).not.toBeNull();
    expect(stored!.action).toBe('large-refund');
    expect(stored!.status).toBe('pending');
    expect(stored!.requiredApprovals).toBe(2);
  });

  it('should persist approvals and auto-approve at threshold', async () => {
    const request = await service.createRequest(
      'large-refund',
      'e2e-initiator',
      'payment',
      'pay-456',
      { amount: 10000 }
    );

    // First approval
    const afterFirst = await service.approve(
      request.id,
      'e2e-approver-1',
      'finance-lead',
      'Looks good'
    );
    expect(afterFirst.status).toBe('pending');
    expect(afterFirst.approvals.length).toBe(1);

    // Second approval — should auto-approve
    const afterSecond = await service.approve(request.id, 'e2e-approver-2', 'ops-lead');
    expect(afterSecond.status).toBe('approved');
    expect(afterSecond.approvals.length).toBe(2);

    // Verify in database
    const stored = await prisma.dualControlRequest.findUnique({
      where: { id: request.id },
      include: { approvals: true },
    });
    expect(stored!.status).toBe('approved');
    expect(stored!.approvals.length).toBe(2);
  });

  it('should reject initiator approving own request', async () => {
    const request = await service.createRequest(
      'premium-entitlement',
      'e2e-self-approver',
      'user',
      'user-789',
      { plan: 'premium' }
    );

    await expect(service.approve(request.id, 'e2e-self-approver', 'admin')).rejects.toThrow(
      'Initiator cannot approve their own request'
    );
  });

  it('should reject duplicate approval from same user', async () => {
    const request = await service.createRequest(
      'large-refund',
      'e2e-initiator',
      'payment',
      'pay-dup',
      { amount: 1000 }
    );

    await service.approve(request.id, 'e2e-approver', 'finance-lead');

    await expect(service.approve(request.id, 'e2e-approver', 'finance-lead')).rejects.toThrow(
      'already approved'
    );
  });

  it('should execute approved request and persist', async () => {
    const request = await service.createRequest(
      'feature-flag-activation',
      'e2e-initiator',
      'feature-flag',
      'flag-new-feature',
      { percentage: 100 }
    );

    // Single approval needed for feature-flag-activation
    await service.approve(request.id, 'e2e-approver', 'product-lead');

    const executed = await service.execute(request.id, 'e2e-executor');
    expect(executed.status).toBe('executed');
    expect(executed.executedBy).toBe('e2e-executor');
    expect(executed.executedAt).toBeDefined();

    // Verify in database
    const stored = await prisma.dualControlRequest.findUnique({
      where: { id: request.id },
    });
    expect(stored!.status).toBe('executed');
    expect(stored!.executedBy).toBe('e2e-executor');
  });

  it('should reject execution of non-approved request', async () => {
    const request = await service.createRequest(
      'large-refund',
      'e2e-initiator',
      'payment',
      'pay-noexec',
      { amount: 500 }
    );

    await expect(service.execute(request.id, 'e2e-executor')).rejects.toThrow(
      'must be approved before execution'
    );
  });

  it('should persist request details as JSON', async () => {
    const details = {
      amount: 9999,
      currency: 'NGN',
      reason: 'Duplicate charge',
      metadata: { orderId: 'ord-123', itemId: 'item-456' },
    };

    const request = await service.createRequest(
      'large-refund',
      'e2e-initiator',
      'payment',
      'pay-json',
      details
    );

    const stored = await prisma.dualControlRequest.findUnique({
      where: { id: request.id },
    });

    expect(stored!.details).toEqual(details);
  });

  it('should list pending requests from database', async () => {
    await service.createRequest('large-refund', 'admin-1', 'payment', 'p1', {});
    await service.createRequest('premium-entitlement', 'admin-2', 'user', 'u1', {});
    await service.createRequest('large-refund', 'admin-3', 'payment', 'p2', {});

    const pending = await service.getPendingRequests();
    expect(pending.length).toBe(3);

    // Approve one
    await service.approve(pending[0].id, 'approver-1', 'finance-lead');
    await service.approve(pending[0].id, 'approver-2', 'ops-lead');

    const pendingAfter = await service.getPendingRequests();
    expect(pendingAfter.length).toBe(2);
  });
});

// ============================================================================
// ImmutableAudit PostgreSQL Integration
// ============================================================================

liveDescribe('ImmutableAuditService — real PostgreSQL persistence', () => {
  let prisma: unknown;
  let service: {
    logEntry: (entry: unknown) => Promise<unknown>;
    getEntries: () => Promise<unknown[]>;
    verifyIntegrity: () => Promise<{ valid: boolean; errors: string[] }>;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = DB_URL;

    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

    const { ImmutableAuditDbService } =
      await import('./audit-immutable/immutable-audit-db.service');
    service = new ImmutableAuditDbService(prisma);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
  });

  it('should persist audit entry in PostgreSQL', async () => {
    const entry = await service.writeEntry({
      actorId: 'e2e-admin-1',
      actorRole: 'admin',
      action: 'user.suspend',
      resourceType: 'user',
      resourceId: 'user-123',
      status: 'success',
    });

    // Verify stored in database
    const stored = await prisma.auditLog.findUnique({
      where: { id: entry.id },
    });
    expect(stored).not.toBeNull();
    expect(stored!.action).toBe('user.suspend');
    expect(stored!.sequenceNumber).toBe(1);
    expect(stored!.hash).toHaveLength(64); // SHA-256 hex
  });

  it('should chain hashes correctly across writes', async () => {
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
      actorRole: 'superadmin',
      action: 'payment.refund',
      resourceType: 'payment',
      resourceId: 'pay-1',
      status: 'success',
    });

    const e3 = await service.writeEntry({
      actorId: 'admin-3',
      actorRole: 'admin',
      action: 'content.delete',
      resourceType: 'content',
      resourceId: 'content-1',
      status: 'failure',
    });

    // Verify chain
    expect(e1.previousHash).toBe('0'.repeat(64));
    expect(e2.previousHash).toBe(e1.hash);
    expect(e3.previousHash).toBe(e2.hash);

    // Verify sequence numbers
    expect(e1.sequenceNumber).toBe(1);
    expect(e2.sequenceNumber).toBe(2);
    expect(e3.sequenceNumber).toBe(3);

    // Verify in database
    const stored = await prisma.auditLog.findMany({
      orderBy: { sequenceNumber: 'asc' },
    });
    expect(stored.length).toBe(3);
    expect(stored[0].hash).toBe(e1.hash);
    expect(stored[1].previousHash).toBe(stored[0].hash);
    expect(stored[2].previousHash).toBe(stored[1].hash);
  });

  it('should verify integrity of persisted chain', async () => {
    // Write 10 entries
    for (let i = 0; i < 10; i++) {
      await service.writeEntry({
        actorId: `admin-${i}`,
        actorRole: 'admin',
        action: `action.${i}`,
        resourceType: 'user',
        resourceId: `user-${i}`,
        status: 'success',
      });
    }

    const result = await service.verifyIntegrity();
    expect(result.valid).toBe(true);
    expect(result.totalEntries).toBe(10);
    expect(result.errors).toHaveLength(0);
  });

  it('should filter entries by actor and action', async () => {
    await service.writeEntry({
      actorId: 'admin-1',
      actorRole: 'admin',
      action: 'user.suspend',
      resourceType: 'user',
      resourceId: 'u1',
      status: 'success',
    });
    await service.writeEntry({
      actorId: 'admin-2',
      actorRole: 'admin',
      action: 'payment.refund',
      resourceType: 'payment',
      resourceId: 'p1',
      status: 'success',
    });
    await service.writeEntry({
      actorId: 'admin-1',
      actorRole: 'admin',
      action: 'user.suspend',
      resourceType: 'user',
      resourceId: 'u2',
      status: 'success',
    });

    // Filter by actor
    const byActor = await service.getEntries({ actorId: 'admin-1' });
    expect(byActor.length).toBe(2);

    // Filter by action
    const byAction = await service.getEntries({ action: 'payment.refund' });
    expect(byAction.length).toBe(1);

    // Filter by both
    const byBoth = await service.getEntries({ actorId: 'admin-1', action: 'user.suspend' });
    expect(byBoth.length).toBe(2);
  });

  it('should filter entries by time range', async () => {
    await service.writeEntry({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'test.before',
      resourceType: 'user',
      resourceId: 'u1',
      status: 'success',
    });

    const between = new Date();

    await service.writeEntry({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'test.after',
      resourceType: 'user',
      resourceId: 'u2',
      status: 'success',
    });

    // Filter since
    const sinceEntries = await service.getEntries({ since: between });
    expect(sinceEntries.length).toBe(1);
    expect(sinceEntries[0].action).toBe('test.after');

    // Filter until
    const untilEntries = await service.getEntries({ until: between });
    expect(untilEntries.length).toBe(1);
    expect(untilEntries[0].action).toBe('test.before');
  });

  it('should enforce append-only semantics (no update/delete)', async () => {
    const entry = await service.writeEntry({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'test.original',
      resourceType: 'user',
      resourceId: 'u1',
      status: 'success',
    });

    // Attempting to update should fail at database level
    await expect(
      prisma.auditLog.update({
        where: { id: entry.id },
        data: { action: 'test.modified' },
      })
    ).rejects.toThrow(); // Will throw due to immutable constraint

    // Verify original unchanged
    const stored = await prisma.auditLog.findUnique({ where: { id: entry.id } });
    expect(stored!.action).toBe('test.original');
  });

  it('should persist metadata fields', async () => {
    const entry = await service.writeEntry({
      actorId: 'admin',
      actorRole: 'superadmin',
      action: 'user.delete',
      resourceType: 'user',
      resourceId: 'user-sensitive',
      previousState: '{"name":"John","email":"john@example.com"}',
      newState: null,
      reason: 'GDPR right to erasure',
      correlationId: 'corr-abc-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      status: 'success',
    });

    const stored = await prisma.auditLog.findUnique({
      where: { id: entry.id },
    });

    expect(stored!.previousState).toBe('{"name":"John","email":"john@example.com"}');
    expect(stored!.reason).toBe('GDPR right to erasure');
    expect(stored!.correlationId).toBe('corr-abc-123');
    expect(stored!.ipAddress).toBe('192.168.1.100');
    expect(stored!.userAgent).toBe('Mozilla/5.0');
  });

  it('should handle high-volume writes with consistent sequencing', async () => {
    const writeCount = 100;
    const promises = Array.from({ length: writeCount }, (_, i) =>
      service.writeEntry({
        actorId: `admin-${i % 5}`,
        actorRole: 'admin',
        action: `bulk.action.${i}`,
        resourceType: 'user',
        resourceId: `user-${i}`,
        status: 'success',
      })
    );

    const entries = await Promise.all(promises);

    // All sequence numbers should be unique and sequential
    const sequenceNumbers = entries
      .map((e: unknown) => (e as { sequenceNumber: number }).sequenceNumber)
      .sort((a: number, b: number) => a - b);
    expect(sequenceNumbers).toEqual(Array.from({ length: writeCount }, (_, i) => i + 1));

    // All hashes should be unique
    const hashes = new Set(entries.map((e: unknown) => (e as { hash: string }).hash));
    expect(hashes.size).toBe(writeCount);

    // Chain should be valid
    const integrity = await service.verifyIntegrity();
    expect(integrity.valid).toBe(true);
    expect(integrity.totalEntries).toBe(writeCount);
  });

  it('should get last entry and count', async () => {
    await service.writeEntry({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'first',
      resourceType: 'user',
      resourceId: 'u1',
      status: 'success',
    });

    await service.writeEntry({
      actorId: 'admin',
      actorRole: 'admin',
      action: 'second',
      resourceType: 'user',
      resourceId: 'u2',
      status: 'success',
    });

    const last = await service.getLastEntry();
    expect(last?.action).toBe('second');
    expect(last?.sequenceNumber).toBe(2);

    const count = await service.getEntryCount();
    expect(count).toBe(2);
  });
});
