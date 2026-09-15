/**
 * live-db-probe.mjs — shared plumbing for scripts that probe live service
 * databases (check-live-schema-lock.mjs, sweep-drift-tracker.mjs).
 *
 * Extracted so every consumer derives database names from the SAME repo
 * convention — a sweep that guessed names differently from the nightly
 * report could clear a violation the nightly would keep reporting (or vice
 * versa). The convention: `azeebo_<service>` from the service's relative
 * path (basename, `-service` stripped, `-` → `_`), overridable per
 * environment via LIVE_DB_NAME_OVERRIDES JSON for hosts whose naming
 * departs from the convention.
 *
 * All probes are READ-ONLY single statements through psql.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Parse the LIVE_DB_NAME_OVERRIDES env JSON. Returns {} on absent/unparsable
 * input (the nightly script's exact semantics — a typo'd override must not
 * crash a nightly report).
 */
export function parseNameOverrides(raw) {
  try {
    const parsed = JSON.parse(raw ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Database name for a service (relative path like
 * `services/core/auth-service`) under the repo convention, overridable by
 * exact relative path or bare basename.
 */
export function liveDbName(rel, overrides = {}) {
  const fallback = `azeebo_${path.basename(rel).replace(/-service$/, '').replace(/-/g, '_')}`;
  return overrides[rel] ?? overrides[path.basename(rel)] ?? fallback;
}

/** Service-specific connection URL from a credentials base URL. */
export function serviceUrl(base, rel, overrides = {}) {
  const u = new URL(base);
  u.pathname = `/${liveDbName(rel, overrides)}`;
  return { url: u.toString(), dbName: liveDbName(rel, overrides) };
}

/**
 * Server-level admin URL — the base with an explicit connect database
 * (`/postgres`), because psql would otherwise fall back to the OS user.
 */
export function adminUrl(base) {
  const u = new URL(base);
  if (!u.pathname || u.pathname === '/') u.pathname = '/postgres';
  return u.toString();
}

/** Run one SQL statement through psql (read-only by convention). */
export function psql(url, sql, { timeoutMs = 30_000 } = {}) {
  return execFileSync('psql', [url, '-tAc', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  });
}

/**
 * Whether the service's database exists on the server behind `base`.
 * Throws on connection/query failure — callers own the UNREACHABLE policy.
 */
export function databaseExists(base, rel, overrides = {}) {
  const dbName = liveDbName(rel, overrides).replace(/'/g, "''");
  return psql(adminUrl(base), `SELECT 1 FROM pg_database WHERE datname='${dbName}'`).trim() === '1';
}
