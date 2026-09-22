import { CsrfMiddleware } from './csrf.middleware';
import { CsrfTokenRegistry } from './csrf-token-registry.service';
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware-level tests for CSRF registry enforcement.
 *
 * Verifies the full enforcement chain: mint-and-register on safe methods,
 * cookie==header double-submit, and the server-side registry check that
 * rejects never-minted tokens while failing open when Redis is down.
 */
function makeRegistry(available = true): CsrfTokenRegistry {
  const registered = new Set<string>();
  const registry = new CsrfTokenRegistry();
  // Replace the Redis-backed internals with an in-memory stand-in so tests
  // exercise the middleware's orchestration, not ioredis.
  Object.defineProperty(registry, 'available', { get: () => available });
  (registry as unknown as { mint: () => string }).mint = jest
    .fn()
    .mockImplementation(() => 'a'.repeat(64));
  (registry as unknown as { register: (t: string) => Promise<void> }).register = jest
    .fn()
    .mockImplementation(async (token: string) => {
      registered.add(token);
    });
  (registry as unknown as { isRegistered: (t: string) => Promise<boolean> }).isRegistered = jest
    .fn()
    .mockImplementation(async (token: string) => {
      if (!available) {
        // Model the real registry's fail-open: when Redis is down it answers
        // "true" (defers to the plain double-submit check) rather than false.
        return true;
      }
      return registered.has(token);
    });
  Object.defineProperty(registry, 'registeredTokens', { get: () => registered });
  return registry;
}

type Ctx = {
  req: Partial<Request> & { cookies?: Record<string, string>; path?: string };
  res: Partial<Response> & { cookies: Record<string, string>; body?: unknown; status: jest.Mock; json: jest.Mock; header: jest.Mock };
  next: NextFunction & { called?: boolean };
};

function makeCtx(method: string, opts: { cookie?: string; header?: string } = {}): Ctx {
  const cookies: Record<string, string> = {};
  if (opts.cookie !== undefined) cookies['_csrf'] = opts.cookie;
  const resCookies: Record<string, string> = {};
  const ctx: Ctx = {
    req: {
      method,
      path: '/api/v1/admin/settings/key',
      cookies,
      headers: opts.header !== undefined ? { 'x-csrf-token': opts.header } : {},
    } as Ctx['req'],
    res: {
      cookies: resCookies,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      cookie: jest.fn(),
    } as unknown as Ctx['res'],
    next: jest.fn() as unknown as NextFunction & { called?: boolean },
  };
  (ctx.res as unknown as { cookie: jest.Mock }).cookie = jest.fn();
  return ctx;
}

describe('CsrfMiddleware × CsrfTokenRegistry', () => {
  const featureFlag = { isEnabled: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    featureFlag.isEnabled.mockClear();
  });

  function makeMiddleware(registry: CsrfTokenRegistry): CsrfMiddleware {
    return new CsrfMiddleware(featureFlag as never, registry);
  }

  it('mints AND registers a token on safe methods when none is present', async () => {
    const registry = makeRegistry();
    const mw = makeMiddleware(registry);
    const ctx = makeCtx('GET');

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).toHaveBeenCalled();

    expect(registry.mint).toHaveBeenCalled();
    expect(registry.register).toHaveBeenCalledWith('a'.repeat(64));
    expect((ctx.res as unknown as { cookie: jest.Mock }).cookie).toHaveBeenCalledWith(
      '_csrf',
      'a'.repeat(64),
      expect.any(Object)
    );
    expect((ctx.res as unknown as { setHeader: jest.Mock }).setHeader).toHaveBeenCalledWith(
      'x-csrf-token',
      'a'.repeat(64)
    );
  });

  it('accepts a mutation whose cookie==header token IS in the registry', async () => {
    const registry = makeRegistry();
    // Mint+register first (bootstrap).
    await (registry as unknown as { register: (t: string) => Promise<void> }).register('a'.repeat(64));

    const mw = makeMiddleware(registry);
    const ctx = makeCtx('PUT', { cookie: 'a'.repeat(64), header: 'a'.repeat(64) });

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('rejects a cookie==header token that was NEVER minted (forged pair)', async () => {
    const registry = makeRegistry(); // registry empty — nothing minted
    const mw = makeMiddleware(registry);
    const ctx = makeCtx('PUT', { cookie: 'b'.repeat(64), header: 'b'.repeat(64) });

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).not.toHaveBeenCalled();
    expect(ctx.res.status).toHaveBeenCalledWith(403);
    expect((ctx.res.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      error: 'CSRF token unknown',
    });
  });

  it('still rejects mismatched cookie/header before consulting the registry', async () => {
    const registry = makeRegistry();
    await (registry as unknown as { register: (t: string) => Promise<void> }).register('a'.repeat(64));

    const mw = makeMiddleware(registry);
    const ctx = makeCtx('PUT', { cookie: 'a'.repeat(64), header: 'c'.repeat(64) });

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).not.toHaveBeenCalled();
    expect(ctx.res.status).toHaveBeenCalledWith(403);
    expect((ctx.res.json as jest.Mock).mock.calls[0][0]).toMatchObject({
      error: 'CSRF token mismatch',
    });
  });

  it('fails OPEN when the registry is unavailable (Redis down)', async () => {
    const registry = makeRegistry(false);
    const mw = makeMiddleware(registry);
    // Never-minted token — passes anyway because the registry cannot answer.
    const ctx = makeCtx('PUT', { cookie: 'b'.repeat(64), header: 'b'.repeat(64) });

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).toHaveBeenCalled();
  });

  it('echoes the still-registered token in the response header without re-minting when a valid CSRF cookie is present', async () => {
    const registry = makeRegistry();
    await (registry as unknown as { register: (t: string) => Promise<void> }).register('a'.repeat(64));
    (registry.register as jest.Mock).mockClear(); // the seeding call above shouldn't count
    const mw = makeMiddleware(registry);
    const ctx = makeCtx('GET', { cookie: 'a'.repeat(64) });

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).toHaveBeenCalled();
    // Existing registered cookie: no new mint, no registration, no Set-Cookie
    // churn — but the token IS echoed in the response header so clients whose
    // cached header drifted from the httpOnly cookie can always re-sync
    // instead of deadlocking on 403s forever.
    expect(registry.mint).not.toHaveBeenCalled();
    expect(registry.register).not.toHaveBeenCalled();
    expect((ctx.res as unknown as { setHeader: jest.Mock }).setHeader).toHaveBeenCalledWith(
      'x-csrf-token',
      'a'.repeat(64)
    );
  });

  it('re-mints (self-heals) when the cookie holds an expired/unregistered token', async () => {
    const registry = makeRegistry();
    const mw = makeMiddleware(registry);
    // Cookie present but its token never registered (TTL expiry, previous
    // deployment) — the middleware must recover instead of deadlocking.
    const ctx = makeCtx('GET', { cookie: 'b'.repeat(64) });

    await mw.use(ctx.req as Request, ctx.res as Response, ctx.next);
    expect(ctx.next).toHaveBeenCalled();
    expect(registry.mint).toHaveBeenCalled();
    expect(registry.register).toHaveBeenCalledWith('a'.repeat(64));
    expect((ctx.res as unknown as { cookie: jest.Mock }).cookie).toHaveBeenCalledWith(
      '_csrf',
      'a'.repeat(64),
      expect.any(Object)
    );
  });
});
