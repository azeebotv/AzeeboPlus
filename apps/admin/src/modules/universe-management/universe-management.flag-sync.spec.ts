import { Test, TestingModule } from '@nestjs/testing';
import { UniverseManagementService } from './universe-management.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * WP7 — DB↔Redis drift contract: universe enable/disable publishes must be
 * honest. `publishFlagToRedis` retries transient failures; a persistently
 * failing Redis surfaces as `flagSync: { ok: false, failedKeys }` on the
 * toggle/bulk/create/update responses (and an audit entry) instead of being
 * swallowed; `resyncUniverse` republishes from Postgres truth; and boot
 * republishes every sentinel + creates DB rows for reserved slugs (music) so
 * the admin can toggle what the gateway gates.
 */
describe('UniverseManagementService — sentinel publish drift (WP7)', () => {
  let service: UniverseManagementService;
  let prisma: {
    universe: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };
  let redisSet: jest.Mock;

  const reality = { id: 'u-1', name: 'reality', isEnabled: true, featureFlags: [] };

  /** Spy the lazy Redis client with a fake whose `set` is `redisSet`. */
  const wireRedis = (target: UniverseManagementService) => {
    jest
      .spyOn(target as unknown as { getFlagRedis: () => unknown }, 'getFlagRedis')
      .mockReturnValue({ set: redisSet, del: jest.fn().mockResolvedValue(1) });
  };

  beforeEach(async () => {
    prisma = {
      universe: {
        findUnique: jest.fn().mockResolvedValue(reality),
        findMany: jest.fn().mockResolvedValue([reality]),
        update: jest.fn().mockResolvedValue(reality),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue(reality),
      },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    redisSet = jest.fn().mockResolvedValue('OK');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniverseManagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: audit },
      ],
    }).compile();

    service = module.get(UniverseManagementService);
    wireRedis(service);
  });

  it('retry succeeds: a single transient set failure still reports flagSync.ok', async () => {
    redisSet.mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValue('OK');

    const result = await service.toggleUniverse('u-1', false, 'admin-1');

    expect(result.flagSync).toEqual({ ok: true, failedKeys: [] });
    expect(redisSet).toHaveBeenCalledTimes(2);
    expect(audit.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'universe.flag_sync_failed' })
    );
  });

  it('persistent failure: DB write still lands, response carries flagSync.ok=false, failure is audited', async () => {
    redisSet.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.toggleUniverse('u-1', false, 'admin-1');

    expect(prisma.universe.update).toHaveBeenCalled(); // Postgres is the source of truth
    expect(result.flagSync).toEqual({ ok: false, failedKeys: ['universe.reality.enabled'] });
    expect(redisSet).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin-1',
        action: 'universe.flag_sync_failed',
        targetId: 'u-1',
        details: expect.objectContaining({ via: 'toggle' }),
      })
    );
  });

  it('bulk toggle collects only the universes whose publish failed', async () => {
    prisma.universe.findMany.mockResolvedValue([
      { id: 'u-1', name: 'reality' },
      { id: 'u-2', name: 'comedy' },
    ]);
    prisma.universe.updateMany.mockResolvedValue({ count: 2 });
    // reality publishes fine; comedy fails all 3 attempts.
    redisSet.mockResolvedValueOnce('OK').mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.bulkToggle({ ids: ['u-1', 'u-2'], isEnabled: false }, 'admin-1');

    expect(result.flagSync).toEqual({ ok: false, failedKeys: ['universe.comedy.enabled'] });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'universe.flag_sync_failed',
        details: expect.objectContaining({ via: 'bulk' }),
      })
    );
  });

  it('resyncUniverse republishes the sentinel from DB truth and reports success', async () => {
    prisma.universe.findUnique.mockResolvedValue({ id: 'u-1', name: 'reality', isEnabled: false });

    const result = await service.resyncUniverse('u-1', 'admin-1');

    expect(redisSet).toHaveBeenCalledWith(
      'feature_flags:universe.reality.enabled',
      expect.stringContaining('"enabled":false')
    );
    expect(result).toEqual({
      id: 'u-1',
      name: 'reality',
      isEnabled: false,
      flagSync: { ok: true, failedKeys: [] },
    });
  });

  it('resyncUniverse 404s for unknown ids', async () => {
    prisma.universe.findUnique.mockResolvedValue(null);
    await expect(service.resyncUniverse('nope')).rejects.toThrow(/not found/i);
  });

  it('boot republishes every enabled sentinel from Postgres state', async () => {
    prisma.universe.findMany.mockResolvedValue([
      { name: 'reality', isEnabled: true },
      { name: 'comedy', isEnabled: false },
    ]);
    prisma.universe.findUnique.mockResolvedValue({ id: 'x', name: 'music' }); // reserved row exists

    await service.onApplicationBootstrap();

    expect(redisSet).toHaveBeenCalledWith(
      'feature_flags:universe.reality.enabled',
      expect.stringContaining('"enabled":true')
    );
    expect(redisSet).toHaveBeenCalledWith(
      'feature_flags:universe.comedy.enabled',
      expect.stringContaining('"enabled":false')
    );
  });

  it('boot creates the reserved music row when absent, and never duplicates it', async () => {
    prisma.universe.findUnique.mockImplementation(async ({ where }: { where: { name: string } }) =>
      where.name === 'music' ? null : { id: 'u-9', name: where.name }
    );
    prisma.universe.findMany.mockResolvedValue([]);

    await service.onApplicationBootstrap();

    expect(prisma.universe.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'music',
          isEnabled: true,
          metadata: expect.objectContaining({ reserved: true }),
        }),
      })
    );

    // Second boot: row now exists → no duplicate create.
    prisma.universe.findUnique.mockImplementation(
      async ({ where }: { where: { name: string } }) => ({ id: 'u-9', name: where.name })
    );
    prisma.universe.create.mockClear();
    await service.onApplicationBootstrap();
    expect(prisma.universe.create).not.toHaveBeenCalled();
  });

  it('a Redis outage at boot does not crash startup', async () => {
    redisSet.mockRejectedValue(new Error('ECONNREFUSED'));
    prisma.universe.findUnique.mockResolvedValue({ id: 'x', name: 'music' });
    prisma.universe.findMany.mockResolvedValue([{ name: 'reality', isEnabled: true }]);

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it('create/update surface flagSync too', async () => {
    redisSet.mockRejectedValue(new Error('ECONNREFUSED'));
    // createUniverse looks up by name (absent → proceeds); updateUniverse by id.
    prisma.universe.findUnique.mockImplementation(
      async ({ where }: { where: { id?: string; name?: string } }) => (where.id ? reality : null)
    );

    prisma.universe.create.mockResolvedValue({ ...reality, name: 'games', isEnabled: true });

    const created = await service.createUniverse(
      { name: 'games', displayName: 'Games', isEnabled: true } as never,
      'admin-1'
    );
    expect(created.flagSync).toEqual({ ok: false, failedKeys: ['universe.games.enabled'] });

    prisma.universe.update.mockResolvedValue({ ...reality, isEnabled: false });
    const updated = await service.updateUniverse('u-1', { isEnabled: false } as never, 'admin-1');
    expect((updated as { flagSync?: unknown }).flagSync).toEqual({
      ok: false,
      failedKeys: ['universe.reality.enabled'],
    });
  });

  it('update without isEnabled keeps the bare universe shape (no flagSync)', async () => {
    const updated = await service.updateUniverse('u-1', { displayName: 'Renamed' } as never);
    expect(updated).not.toHaveProperty('flagSync');
    expect(redisSet).not.toHaveBeenCalled();
  });
});
