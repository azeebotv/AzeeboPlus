'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  fetchBootstrapFlags,
  getFlagValue,
  isFlagEnabled,
  universeFlagKey,
  type BootstrapFlag,
} from '../lib/flags';

interface FlagsContextValue {
  /** Evaluated public flags (key → flag). Empty until the first fetch resolves. */
  flags: Record<string, BootstrapFlag>;
  /** True once bootstrap has loaded at least once (may be an empty map). */
  ready: boolean;
  /** True only when the flag is present AND evaluated enabled. */
  isEnabled: (key: string) => boolean;
  /** Variant payload of an enabled flag (null when absent or disabled). */
  getValue: (key: string) => string | number | boolean | null;
  /** Per-universe nav sentinel: universe.<name>.enabled. */
  universeEnabled: (name: string) => boolean;
  /** Re-fetch from the gateway (drops the local TTL cache for the caller). */
  refresh: () => Promise<void>;
}

const FlagsContext = createContext<FlagsContextValue | undefined>(undefined);

export function FlagsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { user } = useAuth();
  const userId = user?.id;
  const [flags, setFlags] = useState<Record<string, BootstrapFlag>>({});
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchBootstrapFlags(userId);
    setFlags(result);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<FlagsContextValue>(
    () => ({
      flags,
      ready,
      isEnabled: (key) => isFlagEnabled(flags, key),
      getValue: (key) => getFlagValue(flags, key),
      universeEnabled: (name) => isFlagEnabled(flags, universeFlagKey(name)),
      refresh: async () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`azeebo_flags_${userId || 'anon'}`);
          } catch {
            // Ignore storage failures.
          }
        }
        await load();
      },
    }),
    [flags, ready, userId, load]
  );

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useFlags(): FlagsContextValue {
  const context = useContext(FlagsContext);
  if (!context) {
    throw new Error('useFlags must be used within a FlagsProvider');
  }
  return context;
}
