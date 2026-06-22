import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Logger } from '@azeebo/shared-types';

const logger = new Logger('useSecureStorage');

/**
 * Secure storage hook for sensitive data (JWT tokens, credentials).
 * Uses expo-secure-store which leverages iOS Keychain and Android Keystore
 * for encrypted storage at the OS level.
 *
 * T-C06: Use this for accessToken and refreshToken ONLY.
 * Use useStorage (AsyncStorage) for non-sensitive preferences.
 */
export function useSecureStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} {
  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error(
        `Error reading ${key} from secure storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return null;
    }
  }, []);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      logger.error(
        `Error writing ${key} to secure storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error(
        `Error removing ${key} from secure storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
  };
}
