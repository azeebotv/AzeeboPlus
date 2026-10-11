/**
 * Polling-interval tokens — the single source of truth for `refetchInterval`
 * values across web, admin, creator and mobile. Values match the intervals
 * already in production use; do not change them here without noting the
 * freshness impact on every consumer.
 *
 * Surfaces with a real-time backend (WebSocket/SSE — see
 * apps/web/src/hooks/useNotificationsSocket.ts for the WS-first pattern with
 * polling fallback) should subscribe instead of polling; these tokens are for
 * polling surfaces and the fallback path.
 */
export const pollingIntervals = {
  /** Human-perceivable latency surfaces (e.g. moderation status mirrors). */
  realtime: 1_000,
  /** Live overlays updated during playback (e.g. watch-party state). */
  live: 2_000,
  /** Conversational surfaces (e.g. live chat messages). */
  chat: 3_000,
  /** Mobile chat — polls less often than web to conserve battery and data. */
  mobileChat: 5_000,
  /** Actively-watched lists (participants, leaderboards). */
  active: 10_000,
  /** Default freshness for user-facing feeds. */
  standard: 15_000,
  /** Operational dashboards where 30s staleness is acceptable. */
  dashboard: 30_000,
  /** Background/idle surfaces (fallback polls, heartbeat-style checks). */
  idle: 60_000,
} as const;

export type PollingIntervalName = keyof typeof pollingIntervals;
