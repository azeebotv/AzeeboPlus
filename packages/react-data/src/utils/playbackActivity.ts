/**
 * Playback activity registry (platform-agnostic).
 *
 * Session-inactivity timeouts must NOT fire while a video is actually
 * playing: a 45-minute episode on TV otherwise guarantees a mid-episode
 * logout (the session timer only re-armed on AppState transitions, and
 * watching video produces none). Player surfaces call
 * `setPlaybackActive(id, true/false)`; the AuthContext session timer defers
 * while `hasActivePlayback()` is true.
 *
 * Kept free of React Native imports so it is unit-testable in isolation.
 */

const activePlaybackSessions = new Set<string>();

export function setPlaybackActive(sessionId: string, active: boolean): void {
  if (active) {
    activePlaybackSessions.add(sessionId);
  } else {
    activePlaybackSessions.delete(sessionId);
  }
}

export function hasActivePlayback(): boolean {
  return activePlaybackSessions.size > 0;
}

/** Test-only: reset the registry between tests. */
export function resetPlaybackActivityForTests(): void {
  activePlaybackSessions.clear();
}
