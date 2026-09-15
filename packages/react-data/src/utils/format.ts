/**
 * Shared formatting helpers for Azeebo+ clients (mobile + TV).
 *
 * formatTime previously existed as three verbatim copies (mobile player
 * hook, TV player hook, mobile ContentCard duration badge). Single source
 * here so display rules stay identical across surfaces.
 */

/** Format seconds as M:SS or H:MM:SS for player UIs. Negative inputs
 * (possible from player timeUpdate races on some platforms) clamp to 0. */
export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
