import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlService } from './access-control.service';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('AccessControlService', () => {
  let service: AccessControlService;

  const mockFlagService = { isEnabled: jest.fn().mockResolvedValue(false) };

  const mockPrismaService = {
    contentItem: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
    },
    pass: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
    getOrThrow: jest.fn((_key: string) => ''),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: FeatureFlagService,
          useValue: mockFlagService,
        },
      ],
    }).compile();

    service = module.get<AccessControlService>(AccessControlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkContentAccess', () => {
    it('should check access to public content', async () => {
      const mockContent = { id: '1', isPremium: false, status: 'published' };
      mockPrismaService.contentItem.findUnique.mockResolvedValue(mockContent);

      const result = await service.checkContentAccess('user-1', 'content-1');
      expect(result).toBeDefined();
    });

    it('unlocks premium content while content_premium_gate is off (promo mode)', async () => {
      mockFlagService.isEnabled.mockResolvedValue(false);
      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: 'premium-1',
        status: 'published',
        windowType: 'premium',
        isExclusive: true,
        isPremiere: false,
        minAge: null,
        universeId: 'u-1',
      });

      const result = await service.checkContentAccess('user-1', 'premium-1');

      expect(result.hasAccess).toBe(true);
      expect(result.accessType).toBe('unlocked');
    });

    it('denies premium content without entitlement while the gate is on', async () => {
      mockFlagService.isEnabled.mockResolvedValue(true);
      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: 'premium-1',
        status: 'published',
        windowType: 'premium',
        isExclusive: true,
        isPremiere: false,
        minAge: null,
        universeId: 'u-1',
      });
      mockPrismaService.rental.findUnique.mockResolvedValue(null);
      mockPrismaService.pass.findFirst.mockResolvedValue(null);

      const result = await service.checkContentAccess('user-1', 'premium-1');

      expect(result.hasAccess).toBe(false);
      expect(result.accessType).toBe('premium');
    });
  });
});
