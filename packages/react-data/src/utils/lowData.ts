import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Low-Data Mode for the mobile app.
 *
 * Honors the `mobile_low_data_default` server flag: when enabled, users are
 * treated as low-data unless they explicitly opted out. Users can still toggle
 * the preference at runtime via `setLowDataMode`.
 */

export const LOW_DATA_FLAG_KEY = 'mobile_low_data_default';
export const LOW_DATA_STORAGE_KEY = 'lowDataMode';

/** Server flag lookup injected by callers (from useFlags). */
export type FlagLookup = (key: string) => boolean;

/** Async variant — reads the stored preference (defaults to the flag when unset). */
export async function isLowDataModeAsync(isEnabled?: FlagLookup): Promise<boolean> {
  try {
    const preference = await AsyncStorage.getItem(LOW_DATA_STORAGE_KEY);
    if (preference === 'true') return true;
    if (preference === 'false') return false;
    // Unset: fall through to the server default flag.
  } catch {
    // Storage unavailable — fall through to the flag default.
  }
  return isEnabled?.(LOW_DATA_FLAG_KEY) ?? false;
}

export async function setLowDataMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(LOW_DATA_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage failures.
  }
}

/** Whether autoplay should run: flag on AND not low-data. */
export function shouldAutoPlay(isLowData: boolean, isEnabled?: FlagLookup): boolean {
  if (isEnabled && !isEnabled('mobile_autoplay')) return false;
  return !isLowData;
}
