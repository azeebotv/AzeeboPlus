import { Test, TestingModule } from '@nestjs/testing';
import { FixturesService } from './fixtures.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('FixturesService', () => {
  let service: FixturesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockEvent = {
    id: 'event-1',
    title: 'Test Event',
    sport: 'football',
    status: 'scheduled',
    startsAt: new Date('2024-01-01T12:00:00Z'),
    endsAt: null,
    teams: [],
    fixtureMetadata: null,
    PredictionMarket: null,
    contests: [],
    Highlight: [],
    _count: { predictions: 0, fanBoards: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixturesService,
        {
          provide: PrismaService,
          useValue: {
            sportsEvent: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            fixtureMetadata: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FixturesService>(FixturesService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFixtures', () => {
    it('should return paginated fixtures', async () => {
      (prismaService.sportsEvent.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (prismaService.sportsEvent.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getFixtures();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items');
      expect((result.data as any).items).toHaveLength(1);
    });

    it('should filter by sport', async () => {
      (prismaService.sportsEvent.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (prismaService.sportsEvent.count as jest.Mock).mockResolvedValue(1);

      await service.getFixtures(1, 20, 'football');

      expect((prismaService.sportsEvent.findMany as jest.Mock).mock.calls[0][0].where.sport).toBe('football');
    });

    it('should filter by status', async () => {
      (prismaService.sportsEvent.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (prismaService.sportsEvent.count as jest.Mock).mockResolvedValue(1);

      await service.getFixtures(1, 20, undefined, 'scheduled');

      expect((prismaService.sportsEvent.findMany as jest.Mock).mock.calls[0][0].where.status).toBe('scheduled');
    });
  });

  describe('getFixtureById', () => {
    it('should return fixture by id', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.getFixtureById('event-1');

      expect(result.success).toBe(true);
      expect((result.data as any).title).toBe('Test Event');
    });

    it('should throw NotFoundException if fixture not found', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getFixtureById('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFixtureMetadata', () => {
    it('should create fixture metadata', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.fixtureMetadata.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.fixtureMetadata.create as jest.Mock).mockResolvedValue({ id: 'metadata-1' });

      const result = await service.createFixtureMetadata('event-1', {
        venue: 'Stadium A',
        referee: 'John Doe',
      });

      expect(result.success).toBe(true);
      expect((result.data as any).metadataId).toBe('metadata-1');
    });

    it('should update existing metadata', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.fixtureMetadata.findUnique as jest.Mock).mockResolvedValue({ id: 'metadata-1' });
      (prismaService.fixtureMetadata.update as jest.Mock).mockResolvedValue({ id: 'metadata-1' });

      const result = await service.createFixtureMetadata('event-1', {
        venue: 'Updated Stadium',
      });

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if event not found', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createFixtureMetadata('not-found', {})).rejects.toThrow(NotFoundException);
    });
  });
});