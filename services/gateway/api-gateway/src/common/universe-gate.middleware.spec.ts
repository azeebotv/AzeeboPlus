import { HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { UniverseGateMiddleware } from './universe-gate.middleware';

/**
 * WP2: disabled universes must 404 at the edge with the gateway's own
 * route-missing body — indistinguishable from a service that was never
 * registered. Enabled/unknown paths pass through untouched.
 */
describe('UniverseGateMiddleware', () => {
  let isEnabled: jest.Mock;
  let middleware: UniverseGateMiddleware;
  // Express types `path` read-only — the gate only reads method/path, so a
  // plain mutable shape cast at the call site is the honest test double.
  let req: { method: string; path: string };
  let res: Partial<Response>;
  let next: jest.Mock;

  const json = jest.fn();
  const status = jest.fn();

  beforeEach(() => {
    isEnabled = jest.fn().mockResolvedValue(true);
    middleware = new UniverseGateMiddleware({ isEnabled } as unknown as FeatureFlagService);
    req = { method: 'GET', path: '/api/v1/reality/feed' };
    json.mockReset();
    status.mockReset().mockReturnValue({ json });
    res = { status };
    next = jest.fn();
  });

  const gate = () => middleware.use(req as unknown as Request, res as Response, next);

  const flush = () => new Promise((resolve) => setImmediate(resolve));

  it('passes through when the universe sentinel is enabled', async () => {
    gate();
    await flush();
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it('404s with the route-missing body when the sentinel is disabled', async () => {
    isEnabled.mockResolvedValue(false);
    gate();
    await flush();
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({ message: 'Service not found' });
  });

  it.each([
    ['reality', 'universe.reality.enabled'],
    ['comedy', 'universe.comedy.enabled'],
    ['sports', 'universe.sports.enabled'],
    ['vertical', 'universe.vertical.enabled'],
    ['games', 'universe.games.enabled'],
    ['lifestyle', 'universe.lifestyle.enabled'],
  ])('gates /api/v1/%s/* via %s', async (service, key) => {
    req.path = `/api/v1/${service}/anything`;
    gate();
    await flush();
    expect(isEnabled).toHaveBeenCalledWith(key);
  });

  it('maps the plural /movies route to the canonical singular movie slug', async () => {
    req.path = '/api/v1/movies/trending';
    gate();
    await flush();
    expect(isEnabled).toHaveBeenCalledWith('universe.movie.enabled');
  });

  it('also gates the unversioned /api/<service> form', async () => {
    req.path = '/api/comedy/feed';
    gate();
    await flush();
    expect(isEnabled).toHaveBeenCalledWith('universe.comedy.enabled');
  });

  it.each(['creator', 'creators', 'live-events', 'knowledge', 'music', 'content'])(
    'does NOT gate /api/v1/%s (excluded or non-universe service)',
    async (service) => {
      req.path = `/api/v1/${service}/x`;
      gate();
      await flush();
      expect(isEnabled).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    }
  );

  it('never gates OPTIONS (CORS preflight stays transparent)', async () => {
    isEnabled.mockResolvedValue(false);
    req.method = 'OPTIONS';
    gate();
    await flush();
    expect(isEnabled).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('passes non-api paths through without evaluation', async () => {
    req.path = '/health';
    gate();
    await flush();
    expect(isEnabled).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('passes through if evaluation rejects (never black-hole the API)', async () => {
    isEnabled.mockRejectedValue(new Error('boom'));
    gate();
    await flush();
    expect(next).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalled();
  });

  it('does not append a query string into the service match', async () => {
    req.path = '/api/v1/comedy';
    gate();
    await flush();
    expect(isEnabled).toHaveBeenCalledWith('universe.comedy.enabled');
  });
});
