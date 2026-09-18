/**
 * Shared response-shape guards for the admin client.
 *
 * The recurring crash class this module exists for: backend responses arrive
 * as arrays-or-envelopes (`T[]` vs `{ items, total }` vs `{ logs, total }`)
 * and pages used to blind-cast `res.data` and call `.map`/`.filter` on an
 * object → "X.map is not a function" into the error boundary (reports,
 * universes, search, agbala, payment-gateways, subscriptions all crashed
 * this way). The sibling class: numeric fields rendered with
 * `.toLocaleString()` on `undefined` (subscriptions). Every page must
 * unwrap through these helpers instead of casting `res.data` directly.
 *
 * These are runtime guards, not validators: they coerce to a safe shape and
 * never throw, so a degraded upstream response renders an empty/error state
 * instead of taking down the tree.
 */

/** True only for real objects (excludes arrays and null). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Object field guard — `isRecord` for use in expression position. */
export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

/**
 * Coerce an unknown payload to an array. Accepts a bare array, a paginated
 * envelope with the given item key (`items` by default; callers pass `logs`,
 * `data`, etc. for nonstandard endpoints), and falls back to `[]` otherwise.
 */
export function asArray<T>(value: unknown, itemKey = 'items'): T[] {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value)) {
    const inner = value[itemKey];
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

/**
 * Extract a paginated list plus its total from either shape. `total` is
 * `null` when the payload is a bare array (callers fall back to items.length).
 */
export function unwrapList<T>(
  value: unknown,
  itemKey = 'items'
): { items: T[]; total: number | null } {
  if (Array.isArray(value)) return { items: value as T[], total: null };
  if (isRecord(value)) {
    const inner = value[itemKey];
    if (Array.isArray(inner)) {
      const rawTotal = value['total'];
      return { items: inner as T[], total: typeof rawTotal === 'number' ? rawTotal : null };
    }
  }
  return { items: [], total: null };
}

/** Numeric field guard — the `.toLocaleString()` crash class. */
export function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/** String field guard. */
export function str(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

/**
 * Mutation counterpart to the guards above: `apiFetch` RESOLVES failed
 * requests with `{ success: false, message }` instead of rejecting, so a
 * mutation's `onSuccess` fires even on a 4xx/5xx and pages close their forms
 * as if the write had succeeded. Call this first in every mutationFn and
 * throw so `onError` (and the inline error UI) handles the failure.
 */
export function assertSuccess<T extends { success: boolean; message?: string }>(res: T): T {
  if (!res || res.success !== true) {
    throw new Error(
      res && typeof res.message === 'string' && res.message ? res.message : 'Request failed'
    );
  }
  return res;
}

/** Boolean field guard. */
export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  return fallback;
}
