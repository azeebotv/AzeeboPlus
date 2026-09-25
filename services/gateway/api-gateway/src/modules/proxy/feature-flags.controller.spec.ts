import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagService } from '@azeebo/feature-flags';

jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagService: class {},
}));

describe('FeatureFlagsController', () => {
  let controller: FeatureFlagsController;
  let featureFlagService: { getPublicFlags: jest.Mock };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'JWT_ACCESS_SECRET') return 'test-secret';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    featureFlagService = { getPublicFlags: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagsController],
      providers: [
        { provide: FeatureFlagService, useValue: featureFlagService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<FeatureFlagsController>(FeatureFlagsController);
  });

  const makeReq = (overrides: Record<string, unknown> = {}) =>
    ({
      user: undefined,
      headers: {},
      ...overrides,
    }) as unknown as Parameters<FeatureFlagsController['bootstrap']>[0];

  it('returns only the flags the service exposes as public', async () => {
    featureFlagService.getPublicFlags.mockResolvedValue([
      { key: 'web_maintenance_mode', enabled: false },
      { key: 'universe.movie.enabled', enabled: true },
    ]);

    const result = await controller.bootstrap(makeReq());

    expect(result.success).toBe(true);
    expect(result.data.flags).toHaveLength(2);
    expect(result.data.flags[0]).toEqual({ key: 'web_maintenance_mode', enabled: false });
    expect(result.data.evaluatedFor).toBe('anonymous');
    expect(featureFlagService.getPublicFlags).toHaveBeenCalledWith(undefined, undefined);
  });

  it('resolves the user id from a valid bearer token for per-user evaluation', async () => {
    featureFlagService.getPublicFlags.mockResolvedValue([]);

    const { sign } = await import('jsonwebtoken');
    const token = sign({ sub: 'user-123', email: 'a@b.c' }, 'test-secret', {
      issuer: 'azeebo-test',
      audience: 'azeebo-web',
      algorithm: 'HS256',
    });

    await controller.bootstrap(makeReq({ headers: { authorization: `Bearer ${token}` } }));

    expect(featureFlagService.getPublicFlags).toHaveBeenCalledWith('user-123', undefined);
  });

  it('passes the x-anonymous-id header through for stable anonymous bucketing', async () => {
    featureFlagService.getPublicFlags.mockResolvedValue([]);

    await controller.bootstrap(makeReq({ headers: { 'x-anonymous-id': 'visitor-42' } }));

    expect(featureFlagService.getPublicFlags).toHaveBeenCalledWith(undefined, 'visitor-42');
  });

  it('ignores an invalid bearer token and evaluates as anonymous', async () => {
    featureFlagService.getPublicFlags.mockResolvedValue([]);

    await controller.bootstrap(makeReq({ headers: { authorization: 'Bearer not-a-real-token' } }));

    expect(featureFlagService.getPublicFlags).toHaveBeenCalledWith(undefined, undefined);
  });
});
