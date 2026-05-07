import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@azeebo/shared-types';

const logger = new Logger('useStorage');

export function useStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
} {
  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logger.error(
        `Error reading ${key} from storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return null;
    }
  }, []);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logger.error(
        `Error writing ${key} to storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error(
        `Error removing ${key} from storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      logger.error(
        `Error clearing storage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
}
