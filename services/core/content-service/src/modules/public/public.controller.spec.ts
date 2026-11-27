import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RateLimitGuard, RateLimitService } from '@azeebo/security';
import { PublicController } from './public.controller.js';
import { PrismaService } from '../database/prisma.service.js';
import { ContentFeedService } from '../content/content-feed.service.js';

describe('PublicController universe visibility (sentinel filtering)', () => {
  let controller: PublicController;

  const mockPrisma = {
    universe: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockFeed = {
    getVisibleUniverseIds: jest.fn().mockResolvedValue(['u-1']),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContentFeedService, useValue: mockFeed },
        // Controller-level guards aren't exercised by direct method calls;
        // they only need to resolve.
        { provide: RateLimitGuard, useValue: { canActivate: () => true } },
        { provide: RateLimitService, useValue: { isRateLimited: () => false } },
        { provide: 'RATE_LIMIT_STRICT_RESOLVER', useValue: () => false },
      ],
    }).compile();
    controller = module.get(PublicController);
  });

  it('lists only sentinel-visible universes', async () => {
    mockPrisma.universe.findMany.mockResolvedValue([
      {
        id: 'u-1',
        name: 'reality',
        displayName: 'Reality',
        description: null,
        icon: null,
        color: null,
        metadata: null,
        featureFlags: [],
      },
    ]);

    const res = await controller.getEnabledUniverses();

    expect(mockFeed.getVisibleUniverseIds).toHaveBeenCalled();
    expect(mockPrisma.universe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isEnabled: true, id: { in: ['u-1'] } }),
      })
    );
    expect(res.data).toHaveLength(1);
  });

  it('404s a features request for a sentinel-disabled universe even when the local row is enabled', async () => {
    mockPrisma.universe.findUnique.mockResolvedValue({
      id: 'u-2',
      name: 'comedy',
      isEnabled: true,
      featureFlags: [],
    });

    await expect(controller.getUniverseFeatures('comedy')).rejects.toThrow(NotFoundException);
  });

  it('serves features for a visible universe', async () => {
    mockPrisma.universe.findUnique.mockResolvedValue({
      id: 'u-1',
      name: 'reality',
      isEnabled: true,
      featureFlags: [{ featureKey: 'voting_enabled', metadata: null }],
    });

    const res = await controller.getUniverseFeatures('reality');
    expect(res.data).toEqual({
      universe: 'reality',
      features: { voting_enabled: { enabled: true, metadata: null } },
    });
  });

  it('surfaces a feed-service lookup failure as an internal error, not a leak', async () => {
    mockFeed.getVisibleUniverseIds.mockRejectedValue(new Error('redis down'));

    await expect(controller.getEnabledUniverses()).rejects.toThrow(InternalServerErrorException);
  });
});
