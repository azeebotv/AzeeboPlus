import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';

/** Client-side creator UI flag keys (mirrors @azeebo/feature-flags creatorFlags UI subset). */
export const CREATOR_FLAG_KEYS = {
  newAnalytics: 'creator_new_analytics',
  uploadV2: 'creator_upload_v2',
  payoutsUi: 'creator_payouts_ui',
  onboardingWizard: 'creator_onboarding_wizard',
} as const;

/** Registered defaults mirroring the backend FeatureFlagModule registration. */
export const CREATOR_FLAG_DEFAULTS: Record<string, boolean> = {
  [CREATOR_FLAG_KEYS.newAnalytics]: false,
  [CREATOR_FLAG_KEYS.uploadV2]: false,
  [CREATOR_FLAG_KEYS.payoutsUi]: false,
  [CREATOR_FLAG_KEYS.onboardingWizard]: false,
};

interface StudioFlag {
  key: string;
  enabled: boolean;
  value?: unknown;
}

/**
 * Pure resolution: an explicit server value wins; otherwise fall back to the
 * registered default (conservatively off). Exported for tests.
 */
export function resolveCreatorFlag(flags: StudioFlag[], key: string): boolean {
  for (const flag of flags) {
    if (flag.key === key) return flag.enabled === true;
  }
  return CREATOR_FLAG_DEFAULTS[key] === true;
}

/**
 * Loads the studio's own UI flags (from GET /api/v1/creator/flags) and exposes
 * typed helpers. Falls back to the registered defaults while loading/on error.
 */
export function useCreatorFlags(): {
  flags: StudioFlag[];
  isLoading: boolean;
  isEnabled: (key: string) => boolean;
} {
  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['creator', 'flags'],
    queryFn: async () => {
      const res = await creatorApi.getStudioFlags();
      return res.success && Array.isArray(res.data) ? (res.data as StudioFlag[]) : [];
    },
    staleTime: 60_000,
  });

  return {
    flags,
    isLoading,
    isEnabled: (key: string) => resolveCreatorFlag(flags, key),
  };
}
