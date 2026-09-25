jest.mock('expo-linking', () => {
  // Minimal URL parsing mirroring Linking.parse for azeebo:// style URLs.
  const parse = (url: string) => {
    const withoutScheme = url.replace(/^[a-z0-9+.-]+:\/\//i, '');
    const [pathAndQuery] = [withoutScheme];
    const [path, query] = pathAndQuery.split('?');
    const queryParams: Record<string, string> = {};
    new URLSearchParams(query || '').forEach((v, k) => {
      queryParams[k] = v;
    });
    return { path: path || null, queryParams };
  };
  return {
    createURL: (path: string) => `azeebo://${path.replace(/^\//, '')}`,
    parse,
  };
});

import { DeepLinkService } from '../deepLinking';

jest.mock('../logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

describe('DeepLinkService wallet route aliases (L6)', () => {
  const makeRouter = () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() });

  it('parses a wallet deep link as type wallet with the fund subpath', () => {
    const data = DeepLinkService.parseUrl('azeebo://wallet/fund');
    expect(data).not.toBeNull();
    expect(data?.type).toBe('wallet');
    expect(data?.id).toBe('fund');
  });

  it('routes wallet/fund to the mobile add-funds screen', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet/fund', router as never)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet/add-funds');
  });

  it('routes wallet/add-funds to the mobile add-funds screen (TV spelling alias)', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet/add-funds', router as never)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet/add-funds');
  });

  it('routes a plain wallet link to the wallet tab, not add-funds', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet', router as never)).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet');
  });

  it('falls back to the wallet tab for unknown wallet subpaths (graceful, not rejected)', () => {
    const router = makeRouter();
    expect(DeepLinkService.handleDeepLink('azeebo://wallet/unknown-sub', router as never)).toBe(
      true
    );
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wallet');
  });
});
