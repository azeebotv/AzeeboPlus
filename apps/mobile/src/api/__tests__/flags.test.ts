import {
  fetchBootstrapFlags,
  isFlagEnabled,
  getFlagValue,
  universeEnabledKey,
  MOBILE_FLAG_KEYS,
} from '../flags';

// The client imports expo-constants + certificate pinning which don't load in
// jest — mock it (flags.ts only uses getBaseURL).
jest.mock('../client', () => ({
  apiClient: {
    getBaseURL: jest.fn().mockReturnValue('http://gateway.test'),
  },
}));

// Mock AsyncStorage (used for TTL caching + visitor id).
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      __store: store,
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
    },
  };
});

// Mock the fetch bootstrap call.
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Expose the in-memory store for test isolation.

const storageStore = require('@react-native-async-storage/async-storage').default as {
  __store?: Record<string, string>;
};

function clearStorage(): void {
  // Delete every key (the mock's closure reads/writes the same object, so we
  // must mutate in place rather than reassign).
  const store = storageStore.__store;
  if (store) {
    for (const key of Object.keys(store)) delete store[key];
  }
}

describe('mobile flag helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStorage();
  });

  describe('isFlagEnabled / getFlagValue', () => {
    const flags = [
      { key: 'mobile_autoplay', enabled: true },
      { key: 'mobile_dark_mode', enabled: true, value: 'dark' },
      { key: 'mobile_biometric_auth', enabled: false },
    ];

    it('returns true only for present + enabled flags', () => {
      expect(isFlagEnabled(flags, 'mobile_autoplay')).toBe(true);
      expect(isFlagEnabled(flags, 'mobile_biometric_auth')).toBe(false);
      expect(isFlagEnabled(flags, 'missing_flag')).toBe(false);
    });

    it('returns the value payload of an enabled flag', () => {
      expect(getFlagValue(flags, 'mobile_dark_mode')).toBe('dark');
      expect(getFlagValue(flags, 'mobile_biometric_auth')).toBe(null);
      expect(getFlagValue(flags, 'missing_flag')).toBe(null);
    });

    it('exposes the mobile flag keys', () => {
      expect(MOBILE_FLAG_KEYS.autoplay).toBe('mobile_autoplay');
      expect(MOBILE_FLAG_KEYS.biometricAuth).toBe('mobile_biometric_auth');
    });

    it('builds universe sentinel keys', () => {
      expect(universeEnabledKey('reality')).toBe('universe.reality.enabled');
    });
  });

  describe('fetchBootstrapFlags', () => {
    it('fetches from the gateway bootstrap endpoint and normalizes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            flags: [
              { key: 'mobile_autoplay', enabled: true },
              { key: 'mobile_low_data_default', enabled: false },
            ],
            generatedAt: new Date().toISOString(),
            evaluatedFor: 'anonymous',
          },
        }),
      });

      const flags = await fetchBootstrapFlags();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/feature-flags/bootstrap'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(flags).toHaveLength(2);
    });

    it('falls back to an empty array on failure (never throws)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network down'));
      const flags = await fetchBootstrapFlags();
      expect(flags).toEqual([]);
    });
  });
});
