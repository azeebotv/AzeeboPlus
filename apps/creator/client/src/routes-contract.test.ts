import { describe, it, expect, vi, beforeEach } from 'vitest';

// The routes use `@/` path aliases — resolve them for the contract test.
vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Route-contract test: every creator-portal page module must import cleanly and
// export a default React component. This catches broken imports/renamed APIs
// (e.g. a type or helper removed from @/lib) that page rewrites tend to break.
const ROUTES = [
  ['$/', () => import('./App')],
  ['/dashboard', () => import('./routes/dashboard.tsx')],
  ['/overview', () => import('./routes/overview.tsx')],
  ['/content', () => import('./routes/content.tsx')],
  ['/upload', () => import('./routes/upload.tsx')],
  ['/analytics', () => import('./routes/analytics.tsx')],
  ['/earnings', () => import('./routes/earnings.tsx')],
  ['/payouts', () => import('./routes/payouts.tsx')],
  ['/subscribers', () => import('./routes/subscribers.tsx')],
  ['/monetization', () => import('./routes/monetization.tsx')],
  ['/challenges', () => import('./routes/challenges.tsx')],
  ['/profile', () => import('./routes/profile.tsx')],
  ['/settings', () => import('./routes/settings.tsx')],
] as const;

describe.each(ROUTES)('route contract %s', (_path, load) => {
  it('exports a default component', async () => {
    const mod = await load();
    expect(mod.default).toBeTypeOf('function');
  });
});

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('assertSuccess throws on success:false with the server message', async () => {
    const { creatorApi, RequestFailedError } = await import('./lib/api/creator');
    expect(() => creatorApi.assertSuccess({ success: false, message: 'Pending payout already exists' })).toThrow(
      RequestFailedError
    );
  });

  it('assertSuccess returns data on success:true', async () => {
    const { creatorApi } = await import('./lib/api/creator');
    const data = { hello: 'world' };
    expect(creatorApi.assertSuccess({ success: true, data })).toBe(data);
  });
});
