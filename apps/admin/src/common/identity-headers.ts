import type { Request } from 'express';

/**
 * Identity headers stamped onto proxied requests so downstream services'
 * ServiceAuthGuard trusts them (it requires x-user-* to be accompanied by
 * x-gateway-secret, which admin-backend shares with the service fleet).
 *
 * Why this exists: the admin SPA authenticates with httpOnly cookies and
 * never sends an Authorization header, so "forward authorization if present"
 * proxies handed downstream services zero identity on every SPA request
 * (401 "No user identity found in request"). The gateway does the same
 * stamping when IT proxies; these in-app proxies must too.
 */
export function buildIdentityHeaders(req: Request): Record<string, string> {
  const user = (req as Request & { user?: { id?: string; sub?: string; email?: string; role?: string } })
    .user;

  const headers: Record<string, string> = {};

  // Always include the Bearer token when the caller sent one (direct/API
  // callers keep working exactly as before).
  if (req.headers.authorization) {
    headers['authorization'] = req.headers.authorization;
  }

  // When the guards already established the caller's identity (cookie-only
  // SPA traffic, or gateway-stamped x-user-* headers), forward it explicitly.
  const id = user?.id || user?.sub;
  if (id) {
    headers['x-user-id'] = id;
    if (user?.email) headers['x-user-email'] = user.email;
    if (user?.role) headers['x-user-role'] = user.role;

    const secret = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
    if (secret) headers['x-gateway-secret'] = secret;
  }

  return headers;
}
