/**
 * Low-Data Mode Detection
 * Detects the Save-Data header and user preferences to reduce bandwidth usage.
 */

/**
 * Server flag keys consumed by the low-data helpers.
 *
 * `web_autoplay` (on by default): when disabled, autoplay is off regardless of
 * data mode or user preference.
 * `web_low_data_default` (off by default): when enabled, low-data mode defaults
 * to ON unless the user explicitly opted out via localStorage.
 */
export const LOW_DATA_FLAG_KEYS = {
  autoplay: 'web_autoplay',
  lowDataDefault: 'web_low_data_default',
} as const;

export type FlagLookup = (key: string) => boolean;

export function isLowDataMode(isEnabled?: FlagLookup): boolean {
  if (typeof window === 'undefined') return false;

  // Check navigator.connection.saveData
  const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return true;

  // Check user preference from localStorage
  const preference = localStorage.getItem('lowDataMode');
  if (preference === 'true') return true;

  // web_low_data_default: when enabled, treat users as low-data unless they
  // explicitly opted out (preference stored as 'false').
  if (preference === 'false') return false;
  if (isEnabled?.(LOW_DATA_FLAG_KEYS.lowDataDefault)) return true;

  return false;
}

export function setLowDataMode(enabled: boolean): void {
  localStorage.setItem('lowDataMode', String(enabled));
}

/**
 * Returns appropriate image quality based on data mode.
 * @param normalQuality - Normal quality (e.g., 80)
 * @returns Reduced quality for low-data mode
 */
export function getImageQuality(normalQuality: number = 80, isEnabled?: FlagLookup): number {
  return isLowDataMode(isEnabled) ? Math.min(normalQuality, 40) : normalQuality;
}

/**
 * Returns whether auto-play should be enabled.
 *
 * Autoplay is gated by the `web_autoplay` server flag first: when the flag is
 * off, autoplay never runs. When on, it still respects low-data mode.
 */
export function shouldAutoPlay(isEnabled?: FlagLookup): boolean {
  if (isEnabled && !isEnabled(LOW_DATA_FLAG_KEYS.autoplay)) return false;
  return !isLowDataMode(isEnabled);
}

/**
 * Returns appropriate image size for current data mode.
 * @param normalSize - Normal size in pixels
 * @returns Reduced size for low-data mode
 */
export function getImageSize(normalSize: number, isEnabled?: FlagLookup): number {
  return isLowDataMode(isEnabled) ? Math.floor(normalSize * 0.5) : normalSize;
}
