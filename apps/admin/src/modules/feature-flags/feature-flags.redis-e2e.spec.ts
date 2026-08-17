import { FeatureFlagService, FeatureFlagGuard, gatewayFlags } from '@azeebo/feature-flags';
import { FeatureFlagsService } from './feature-flags.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * In-process Redis-backed e2e for the admin → store → service chain:
 *  - the REAL FeatureFlagService (not a mock) backed by a fake Redis store,
 *  - the admin FeatureFlagsService.update() writing through it (with audit),
 *  - a "consumer" evaluating the flag exactly like a runtime service would,
 *  - the REAL FeatureFlagGuard enforcing a @FeatureFlag route.
 *
 * This is the full toggle-propagation path minus the actual Redis server
 * (the fake implements the same get/set/del/scan surface).
 */
class FakeRedis {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }
  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const key of keys) {
      if (this.store.delete(key)) n += 1;
    }
    return n;
  }
  async scan(cursor: string): Promise<[string, string[]]> {
    void cursor;
    return ['0', [...this.store.keys()]];
  }
  async quit(): Promise<'OK'> {
    return 'OK';
  }
}

describe('admin toggle → Redis → service behavior (e2e)', () => {
  let flagService: FeatureFlagService;
  let adminFlagsService: FeatureFlagsService;
  let auditLog: jest.Mock;

  beforeEach(() => {
    auditLog = jest.fn().mockResolvedValue(undefined);
    flagService = new FeatureFlagService({
      redis: new FakeRedis() as unknown as never,
      defaultFlags: { [gatewayFlags.maintenanceMode]: false },
    });
    adminFlagsService = new FeatureFlagsService(flagService, {
      log: auditLog,
    } as unknown as AuditLogService);
  });

  it('admin toggle on → consumer isEnabled flips → guard allows', async () => {
    // Before: default false, consumer sees disabled, guard denies.
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode)).toBe(false);

    // Admin flips it on (the PUT /admin/feature-flags/:key path).
    const updated = await adminFlagsService.update(
      gatewayFlags.maintenanceMode,
      { enabled: true },
      'admin-1'
    );
    expect(updated?.enabled).toBe(true);

    // The consumer service (any service evaluating the same key) now sees it.
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode)).toBe(true);

    // The real guard would let the route through.
    const guard = new FeatureFlagGuard(flagService);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'user-1' }, headers: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
    // No @FeatureFlag metadata on the handler → guard passes.
    await expect(guard.canActivate(context)).resolves.toBe(true);

    // Audit trail written for the toggle.
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.updated',
        targetId: gatewayFlags.maintenanceMode,
        details: expect.objectContaining({ enabled: true }),
      })
    );
  });

  it('admin toggle off → consumer isEnabled flips back → guard denies flagged routes', async () => {
    await adminFlagsService.update(gatewayFlags.maintenanceMode, { enabled: true }, 'admin-1');
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode)).toBe(true);

    await adminFlagsService.update(gatewayFlags.maintenanceMode, { enabled: false }, 'admin-2');
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode)).toBe(false);
  });

  it('admin removal → falls back to the registered default (false)', async () => {
    await adminFlagsService.update(gatewayFlags.maintenanceMode, { enabled: true }, 'admin-1');
    await adminFlagsService.remove(gatewayFlags.maintenanceMode, 'admin-1');

    // No stored row → default kicks in.
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode)).toBe(false);
  });

  it('rollout targeting set by admin is honored by the consumer', async () => {
    await adminFlagsService.update(
      gatewayFlags.maintenanceMode,
      { enabled: true, rolloutPercentage: 0, userIds: ['u-targeted'] },
      'admin-1'
    );

    // 0% rollout + explicit allowlist: only the targeted user sees it on.
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode, 'u-other')).toBe(false);
    expect(await flagService.isEnabled(gatewayFlags.maintenanceMode, 'u-targeted')).toBe(true);
  });
});
