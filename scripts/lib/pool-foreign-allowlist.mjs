// ============================================================================
// pool-foreign-allowlist.mjs — the shared POOL_FOREIGN_ALLOWLIST parser
//
// ONE approval list for foreign direct-Postgres dialers, consumed by every
// gate that surfaces them: pool-bypass-gate's foreign-dialer persistence
// core, pool-issue-tracker's foreign tracking kind, and job-health-gate's
// new-foreign-workspace alert.
//
// Format: comma-separated EXACT workspace paths (whitespace tolerated;
// empty/absent → no approvals). Paths match what pool-audit records — the
// client process's absolute cwd, e.g. `/Users/me/partner-fleet/services/api`
// — with NO globbing, so an entry can never accidentally approve a sibling
// path.
//
// Approval semantics everywhere: waives ALERTING/TRACKING, never visibility.
// An approved dialer is still counted wherever the connection budget is
// reported; it just can never read as sustained (bypass gate) or new
// (job-health gate) or keep a tracking issue open (pool tracker).
// ============================================================================

/**
 * Parse POOL_FOREIGN_ALLOWLIST. Exported so the unit tests pin the parsing
 * contract in exactly one place (previously duplicated in
 * pool-issue-tracker.mjs).
 */
export function parseAllowlist(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
