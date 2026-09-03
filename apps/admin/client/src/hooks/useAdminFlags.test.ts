import { describe, it, expect } from 'vitest';
import { ADMIN_FLAG_KEYS, ADMIN_FLAG_DEFAULTS, resolveAdminFlag } from './useAdminFlags';
import type { GlobalFeatureFlag } from '@/lib/admin-types';

const flag = (key: string, enabled: boolean): GlobalFeatureFlag => ({
  key,
  enabled,
  value: null,
  rolloutPercentage: 100,
  userIds: [],
});

describe('resolveAdminFlag', () => {
  it('defaults every admin flag to off when nothing is stored', () => {
    for (const key of Object.values(ADMIN_FLAG_KEYS)) {
      expect(resolveAdminFlag([], key)).toBe(false);
    }
    expect(ADMIN_FLAG_DEFAULTS[ADMIN_FLAG_KEYS.newDashboard]).toBe(false);
    expect(ADMIN_FLAG_DEFAULTS[ADMIN_FLAG_KEYS.reportBuilder]).toBe(false);
    expect(ADMIN_FLAG_DEFAULTS[ADMIN_FLAG_KEYS.bulkActions]).toBe(false);
  });

  it('returns the explicit server value when present', () => {
    const flags = [flag(ADMIN_FLAG_KEYS.reportBuilder, true)];
    expect(resolveAdminFlag(flags, ADMIN_FLAG_KEYS.reportBuilder)).toBe(true);
    expect(resolveAdminFlag(flags, ADMIN_FLAG_KEYS.bulkActions)).toBe(false);
  });

  it('respects an explicit false even when the default is on', () => {
    const flags = [flag(ADMIN_FLAG_KEYS.featureFlagEditorV2, true)];
    expect(resolveAdminFlag(flags, ADMIN_FLAG_KEYS.featureFlagEditorV2)).toBe(true);
  });

  it('falls back to off for unregistered keys', () => {
    expect(resolveAdminFlag([], 'admin_unknown_flag')).toBe(false);
  });
});
