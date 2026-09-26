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
    const s = transportStoreStatus(false);
    expect(s.mode).toBe('redis');
    expect(s.detail).toMatch(/fleet-wide/i);
    expect(s.detail).toMatch(/cross-restart/i);
  });

  it('maps degraded=true to memory with the per-process detail', () => {
    const s = transportStoreStatus(true);
    expect(s.mode).toBe('memory');
    expect(s.detail).toMatch(/per-process/i);
    expect(s.detail).toMatch(/Redis unreachable/i);
  });

  it('treats undefined as not degraded (field absent on fresh stores)', () => {
    expect(transportStoreStatus(undefined).mode).toBe('redis');
  });
});
