/**
 * Low-Data Mode Detection
 * Detects the Save-Data header and user preferences to reduce bandwidth usage.
 */

export function isLowDataMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check navigator.connection.saveData
  const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return true;

  // Check user preference from localStorage
  const preference = localStorage.getItem('lowDataMode');
  if (preference === 'true') return true;

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
export function getImageQuality(normalQuality: number = 80): number {
  return isLowDataMode() ? Math.min(normalQuality, 40) : normalQuality;
}

/**
 * Returns whether auto-play should be enabled.
 */
export function shouldAutoPlay(): boolean {
  return !isLowDataMode();
}

/**
 * Returns appropriate image size for current data mode.
 * @param normalSize - Normal size in pixels
 * @returns Reduced size for low-data mode
 */
export function getImageSize(normalSize: number): number {
  return isLowDataMode() ? Math.floor(normalSize * 0.5) : normalSize;
}
