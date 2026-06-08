import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Universe {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, unknown>;
  featureFlags: {
    key: string;
    metadata?: Record<string, unknown>;
  }[];
}

interface UseUniversesReturn {
  universes: Universe[];
  isLoading: boolean;
  error: string | null;
  getUniverse: (name: string) => Universe | undefined;
  isUniverseEnabled: (name: string) => boolean;
  hasFeature: (universeName: string, featureKey: string) => boolean;
}

export function useUniverses(): UseUniversesReturn {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUniverses = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await api.request<Universe[]>('/v1/public/universes');

        if (response.success && response.data) {
          setUniverses(response.data);
        } else {
          setError(response.message || 'Failed to fetch universes');
        }
      } catch (err: unknown) {
        webLogger.error('Failed to fetch universes', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch universes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUniverses();
  }, []);

  const getUniverse = (name: string): Universe | undefined => {
    return universes.find((u) => u.name === name);
  };

  const isUniverseEnabled = (name: string): boolean => {
    return universes.some((u) => u.name === name);
  };

  const hasFeature = (universeName: string, featureKey: string): boolean => {
    const universe = getUniverse(universeName);
    if (!universe) return false;
    return universe.featureFlags.some((flag) => flag.key === featureKey);
  };

  return {
    universes,
    isLoading,
    error,
    getUniverse,
    isUniverseEnabled,
    hasFeature,
  };
}

interface UseSettingsReturn {
  settings: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  getSetting: <T = unknown>(key: string, defaultValue?: T) => T;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await api.request<Record<string, unknown>>('/v1/public/settings');

        if (response.success && response.data) {
          setSettings(response.data);
        } else {
          setError(response.message || 'Failed to fetch settings');
        }
      } catch (err: unknown) {
        webLogger.error('Failed to fetch settings', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const getSetting = <T = unknown>(key: string, defaultValue?: T): T => {
    if (key in settings) {
      return settings[key] as T;
    }
    return defaultValue as T;
  };

  return {
    settings,
    isLoading,
    error,
    getSetting,
  };
}
