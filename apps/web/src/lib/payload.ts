import type { ApiResponse } from './api/base';

/**
 * `apiFetch` resolves a failed request as `{ success: false, … }` instead of
 * rejecting, so a queryFn that returns a fallback on failure leaves react-query
 * in `status: 'success'`. Pages then compute their headline numbers from that
 * fallback and render an outage as "₦0 / 0 rows" — indistinguishable from a
 * genuinely empty ledger. Throwing here is what makes an error branch reachable.
 */
export function requireData<T>(res: ApiResponse<T>, fallback: T): T;
export function requireData<T>(res: ApiResponse<T>): T | undefined;
export function requireData<T>(res: ApiResponse<T>, fallback?: T): T | undefined {
  if (!res || res.success === false) throw new Error(messageOf(res));
  return res.data ?? fallback;
}

/**
 * List read that keeps its array shape on a successful-but-empty response
 * (bare array or `{ items }` envelope) while still throwing on failure.
 */
export function requireArray<T>(res: ApiResponse<T[] | { items?: T[] }>): T[] {
  const data = requireData(res);
  if (Array.isArray(data)) return data;
  const wrapped = data as { items?: T[] } | undefined;
  return Array.isArray(wrapped?.items) ? wrapped!.items : [];
}

/** Human-readable reason from either an error envelope or a thrown Error. */
export function messageOf(error: unknown): string {
  if (!error) return 'Request failed';
  if (error instanceof Error) return error.message;
  const res = error as { message?: string; detail?: string };
  return res.message || res.detail || 'Request failed';
}
