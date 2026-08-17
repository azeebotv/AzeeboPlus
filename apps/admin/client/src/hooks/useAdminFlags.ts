import { useQuery } from '@tanstack/react-query';
import { adminFlags } from '@azeebo/feature-flags/registries';
import { adminApi } from '@/lib/api/admin';
import type { GlobalFeatureFlag } from '@/lib/admin-types';

/** Client-side admin flag keys — single source of truth: @azeebo/feature-flags adminFlags registry. */
export const ADMIN_FLAG_KEYS = adminFlags;

/** Registered defaults mirroring the backend FeatureFlagModule registration. */
export const ADMIN_FLAG_DEFAULTS: Record<string, boolean> = {
  [ADMIN_FLAG_KEYS.newDashboard]: false,
  [ADMIN_FLAG_KEYS.featureFlagEditorV2]: false,
  [ADMIN_FLAG_KEYS.reportBuilder]: false,
  [ADMIN_FLAG_KEYS.bulkActions]: false,
};

/**
 * Pure resolution: an explicit server value wins; otherwise fall back to the
 * registered default (conservatively off when unregistered). Exported for tests.
 */
export function resolveAdminFlag(
  flags: GlobalFeatureFlag[],
  key: string,
): boolean {
  for (const flag of flags) {
    if (flag.key === key) return flag.enabled === true;
  }
  return ADMIN_FLAG_DEFAULTS[key] === true;
}

/**
 * Loads the admin app's own global flags (from GET /api/v1/admin/feature-flags)
 * and exposes typed helpers. Falls back to the registered defaults while the
 * query is loading or on error, so gating is conservative (off).
 */
export function useAdminFlags(): {
  flags: GlobalFeatureFlag[];
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
} {
  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'global-feature-flags'],
    queryFn: async () => {
      const res = await adminApi.listGlobalFeatureFlags();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60_000,
  });

  return {
    flags,
    isLoading,
    isEnabled: (key: string) => resolveAdminFlag(flags, key),
  };
}
