import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONSENT_COOKIE, CONSENT_VERSION, DEFAULT_CONSENT_STATE } from '@/lib/consent';

/**
 * AUD-07: the web analytics SDK must default to NO consent and only run
 * while the cookie banner's stored choice grants it (AUD-45: the choice is
 * stored in the __Host- consent cookie).
 */

type SdkMock = {
  config: Record<string, unknown>;
  track: ReturnType<typeof vi.fn>;
  setConsent: ReturnType<typeof vi.fn>;
  setUser: ReturnType<typeof vi.fn>;
  clearUser: ReturnType<typeof vi.fn>;
};

const { instances } = vi.hoisted(() => ({ instances: [] as SdkMock[] }));

vi.mock('@azeebo/analytics-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@azeebo/analytics-sdk')>();
  class MockAnalytics {
    config: Record<string, unknown>;
    track = vi.fn();
    setConsent = vi.fn();
    setUser = vi.fn();
    clearUser = vi.fn();
    constructor(config: Record<string, unknown>) {
      this.config = config;
      instances.push(this);
    }
  }
  return { ...actual, Analytics: MockAnalytics };
});

/** Fresh module graph + fresh SDK instance, so module-load side effects re-run. */
async function loadAnalyticsModule() {
  vi.resetModules();
  instances.length = 0;
  const mod = await import('@/lib/analytics');
  return { mod, sdk: instances[instances.length - 1] };
}

function grantStored(overrides: Record<string, unknown> = {}) {
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify({
      ...DEFAULT_CONSENT_STATE,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      ...overrides,
    })
  )}; Path=/; Secure; SameSite=Lax`;
}

describe('analytics consent gate (AUD-07)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; Secure`;
  });

  it('initializes the SDK with analytics and marketing consent OFF', async () => {
    const { sdk } = await loadAnalyticsModule();
    const defaults = sdk.config.defaultConsent as Record<string, boolean>;
    expect(defaults.analytics).toBe(false);
    expect(defaults.marketing).toBe(false);
    expect(defaults.essential).toBe(true);
  });

  it('pushes a deny into the SDK when no banner choice is stored', async () => {
    const { sdk } = await loadAnalyticsModule();
    expect(sdk.setConsent).toHaveBeenCalledWith('analytics', false);
    expect(sdk.setConsent).toHaveBeenCalledWith('marketing', false);
  });

  it('honours a stored grant when the module loads', async () => {
    grantStored({ analytics: true, marketing: true });
    const { sdk } = await loadAnalyticsModule();
    expect(sdk.setConsent).toHaveBeenCalledWith('analytics', true);
    expect(sdk.setConsent).toHaveBeenCalledWith('marketing', true);
  });

  it('ignores an outdated consent schema on load', async () => {
    grantStored({ analytics: true, version: '0.9' });
    const { sdk } = await loadAnalyticsModule();
    expect(sdk.setConsent).toHaveBeenCalledWith('analytics', false);
  });

  it('drops track() calls before opt-in', async () => {
    const { mod, sdk } = await loadAnalyticsModule();
    mod.analytics.pageView('/home');
    expect(sdk.track).not.toHaveBeenCalled();
  });

  it('passes track() through after opt-in', async () => {
    grantStored({ analytics: true });
    const { mod, sdk } = await loadAnalyticsModule();
    mod.analytics.pageView('/home');
    expect(sdk.track).toHaveBeenCalledTimes(1);
    expect(sdk.track).toHaveBeenCalledWith(expect.objectContaining({ name: 'page_view' }));
  });

  it('applyAnalyticsConsent pushes banner saves straight to the SDK', async () => {
    const { mod, sdk } = await loadAnalyticsModule();
    mod.applyAnalyticsConsent(true, true);
    expect(sdk.setConsent).toHaveBeenCalledWith('analytics', true);
    expect(sdk.setConsent).toHaveBeenCalledWith('marketing', true);

    mod.applyAnalyticsConsent(false, false);
    expect(sdk.setConsent).toHaveBeenCalledWith('analytics', false);
    expect(sdk.setConsent).toHaveBeenCalledWith('marketing', false);
  });
});
