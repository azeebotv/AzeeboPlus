import { transportStoreStatus } from '../ops.service';

/**
 * Unit tests for the transport-store status mapping behind the Ops Health
 * header chip (GET /admin/ops/services → transportStore). REDIS means
 * baselines + hold-window flips are fleet-wide; MEMORY means the store
 * degraded (Redis unreachable) and flip memory is per-process — flips still
 * detect within one replica, but a restart or a second replica loses the
 * history, so degraded must be visible at a glance.
 *
 * Run: cd apps/admin && npx jest transport-store-status
 */

describe('transportStoreStatus', () => {
  it('maps a healthy store to redis-backed with the fleet-wide detail', () => {
    const s = transportStoreStatus(false, 1);
    expect(s.mode).toBe('redis');
    expect(s.detail).toMatch(/fleet-wide/i);
    expect(s.detail).toMatch(/cross-restart/i);
    expect(s.detail).toMatch(/DB 1/);
  });

  it('maps degraded=true to memory with the per-process detail', () => {
    const s = transportStoreStatus(true, 1);
    expect(s.mode).toBe('memory');
    expect(s.detail).toMatch(/per-process/i);
    expect(s.detail).toMatch(/Redis unreachable/i);
    expect(s.redisDb).toBe(1);
  });

  it('treats undefined as not degraded (field absent on fresh stores)', () => {
    expect(transportStoreStatus(undefined, 1).mode).toBe('redis');
  });

  it('surfaces the resolved DB index on both modes', () => {
    expect(transportStoreStatus(false, 2).redisDb).toBe(2);
    expect(transportStoreStatus(true, 7).redisDb).toBe(7);
  });

  it('reports an unconfirmed DB when the index is unknown (null/undefined)', () => {
    for (const s of [transportStoreStatus(false, null), transportStoreStatus(false)]) {
      expect(s.redisDb).toBeNull();
      expect(s.detail).toMatch(/unconfirmed Redis DB/i);
    }
  });

  it('rejects non-integer or negative indexes as unknown', () => {
    expect(transportStoreStatus(false, 1.5).redisDb).toBeNull();
    expect(transportStoreStatus(false, -1).redisDb).toBeNull();
    expect(transportStoreStatus(false, Number.NaN).redisDb).toBeNull();
  });
});
