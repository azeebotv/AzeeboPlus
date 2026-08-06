import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

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
