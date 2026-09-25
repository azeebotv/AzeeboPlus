import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isFlagEnabled,
  getFlagValue,
  getOrCreateVisitorId,
  fetchBootstrapFlags,
  universeEnabledKey,
  WEB_FLAG_KEYS,
  type BootstrapFlag,
} from '../flags';

const makeFlags = (): Record<string, BootstrapFlag> => ({
  [WEB_FLAG_KEYS.maintenanceMode]: { key: WEB_FLAG_KEYS.maintenanceMode, enabled: true },
  [universeEnabledKey('reality')]: { key: universeEnabledKey('reality'), enabled: false },
  [universeEnabledKey('movie')]: { key: universeEnabledKey('movie'), enabled: true },
  variant_flag: { key: 'variant_flag', enabled: true, value: 'high' },
});

describe('flags helpers', () => {
  it('evaluates enabled flags as true and unknown flags as false', () => {
    const flags = makeFlags();
    expect(isFlagEnabled(flags, WEB_FLAG_KEYS.maintenanceMode)).toBe(true);
    expect(isFlagEnabled(flags, 'missing_key')).toBe(false);
  });

  it('builds universe sentinel keys', () => {
    expect(universeEnabledKey('reality')).toBe('universe.reality.enabled');
  });

  it('hides disabled universes and shows enabled ones', () => {
    const flags = makeFlags();
    expect(isFlagEnabled(flags, universeEnabledKey('reality'))).toBe(false);
    expect(isFlagEnabled(flags, universeEnabledKey('movie'))).toBe(true);
  });

  it('returns variant payloads only for enabled flags', () => {
    const flags = makeFlags();
    expect(getFlagValue(flags, 'variant_flag')).toBe('high');
    expect(getFlagValue(flags, WEB_FLAG_KEYS.maintenanceMode)).toBeNull();
  });

  it('creates a stable visitor id', () => {
    const first = getOrCreateVisitorId();
    const second = getOrCreateVisitorId();
    expect(first).toBe(second);
  });
});

describe('fetchBootstrapFlags', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('maps the gateway response into a keyed map and caches it', async () => {
    const payload = {
      data: {
        flags: [
          { key: 'web_maintenance_mode', enabled: true },
          { key: 'universe.movie.enabled', enabled: true },
        ],
        generatedAt: new Date().toISOString(),
        evaluatedFor: 'anonymous',
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });
    vi.stubGlobal('fetch', fetchMock);

    const flags = await fetchBootstrapFlags('user-1');
    expect(flags['web_maintenance_mode']?.enabled).toBe(true);
    expect(flags['universe.movie.enabled']?.enabled).toBe(true);
    expect(localStorage.getItem('azeebo_flags_user-1')).not.toBeNull();
  });

  it('falls back to an empty map when the gateway is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const flags = await fetchBootstrapFlags('user-1');
    expect(flags).toEqual({});
  });
});
