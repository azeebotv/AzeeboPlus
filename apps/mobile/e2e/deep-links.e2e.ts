import { describe, it, expect } from '@jest/globals';

/**
 * Contract: wallet deep-link route aliases (L6).
 *
 * The shared DeepLinkService resolves `azeebo://wallet/fund` and
 * `azeebo://wallet/add-funds` to mobile's add-funds screen regardless of
 * which surface (or an old push notification) produced the link. Mobile's
 * unit-suite has no tests, so this contract test exercises the shared
 * implementation through the e2e config like the other suites here.
 */

jest.mock('@azeebo/react-data/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `azeebo://${path.replace(/^\//, '')}`,
  parse: (url: string) => {
    const withoutScheme = url.replace(/^[a-z0-9+.-]+:\/\//i, '');
    const [path, query] = withoutScheme.split('?');
    const queryParams: Record<string, string> = {};
    new URLSearchParams(query || '').forEach((v, k) => {
      queryParams[k] = v;
    });
    return { path: path || null, queryParams };
  },
  // Virtual: react-data resolves expo-linking through the pnpm store, which
  // may be a different real path than the test file's — key the mock by name.
}), { virtual: true });

jest.mock(
  'expo-router',
  () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }) }),
  { virtual: true }
);

const { DeepLinkService } = require('@azeebo/react-data/utils/deepLinking') as {
  DeepLinkService: (typeof import('@azeebo/react-data/utils/deepLinking'))['DeepLinkService'];
};

describe('Wallet deep-link route aliases contract (L6)', () => {
  const makeRouter = () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() });

  it('routes wallet/fund to the mobile add-funds screen', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet/fund', router as never)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet/add-funds');
  });

  it('routes wallet/add-funds (TV spelling) to the same screen', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet/add-funds', router as never)).toBe(
      true
    );
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet/add-funds');
  });

  it('routes a plain wallet link to the wallet tab', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet', router as never)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet');
  });
});
