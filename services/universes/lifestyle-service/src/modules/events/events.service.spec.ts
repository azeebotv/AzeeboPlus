import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CacheService } from '@azeebo/shared-services';

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockCategory = {
    id: 'category-1',
    name: 'Music',
    slug: 'music',
    description: 'Music events',
    icon: '🎵',
  };

  const mockCreator = {
    id: 'user-123',
    displayName: 'Event Creator',
    username: 'creator',
  };

  const mockRsvp = {
    id: 'rsvp-1',
    userId: 'user-456',
    eventId: 'event-1',
    status: 'attending',
    guests: 1,
    note: '',
    createdAt: new Date('2024-01-15'),
  };

  const mockEvent = {
    id: 'event-1',
    title: 'Test Event',
    slug: 'test-event',
    description: 'Test description',
    coverImage: 'https://example.com/cover.jpg',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-02'),
    location: 'New York',
    venue: 'Test Venue',
    isOnline: false,
    onlineLink: '',
    maxAttendees: 100,
    status: 'published',
    categoryId: 'category-1',
    category: mockCategory,
    creatorId: 'user-123',
    creator: mockCreator,
    viewCount: 200,
    rsvpCount: 50,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    rsvps: [mockRsvp],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            eventCategory: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            eventRsvp: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn((fn: unknown) => {
              const prismaMock = (service as unknown as { prisma: Record<string, unknown> })?.prisma;
              return typeof fn === 'function'
                ? (fn as (tx: unknown) => unknown)(prismaMock ?? {})
                : Promise.all(fn as unknown[]);
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
            getOrThrow: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            delete: jest.fn().mockResolvedValue(1),
            invalidate: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEvents', () => {
    it('should return paginated events', async () => {
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (prismaService.event.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEvents();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by category', async () => {
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (prismaService.event.count as jest.Mock).mockResolvedValue(1);

      await service.getEvents(1, 20, 'music');

      expect((prismaService.event.findMany as jest.Mock).mock.calls[0][0].where.category).toEqual({
        slug: 'music',
      });
    });
  });

  describe('getEventBySlug', () => {
    it('should return event details', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.event.update as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.getEventBySlug('test-event');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Test Event');
    });

    it('should throw NotFoundException if event not found', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEventBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      (prismaService.eventCategory.findMany as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await service.getCategories();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      (prismaService.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.createEvent({
        title: 'Test Event',
        description: 'Test description',
        startDate: '2024-02-01',
        creatorId: 'user-123',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-event');
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.event.update as jest.Mock).mockResolvedValue({
        ...mockEvent,
        title: 'Updated Event',
        slug: 'updated-event',
      });

      const result = await service.updateEvent('event-1', { title: 'Updated Event' });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).title).toBe('Updated Event');
    });

    it('should throw NotFoundException if event not found', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEvent('not-found', { title: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.event.delete as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.deleteEvent('event-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Event deleted successfully');
    });

    it('should throw NotFoundException if event not found', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEvent('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rsvpEvent', () => {
    it('should create RSVP successfully', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.eventRsvp.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.eventRsvp.create as jest.Mock).mockResolvedValue(mockRsvp);
      (prismaService.event.update as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.rsvpEvent('event-1', 'user-456', { status: 'attending' });

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if already RSVPed', async () => {
      (prismaService.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.eventRsvp.findUnique as jest.Mock).mockResolvedValue(mockRsvp);

      await expect(
        service.rsvpEvent('event-1', 'user-456', { status: 'attending' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelRsvp', () => {
    it('should cancel RSVP successfully', async () => {
      const mockRsvpWithEvent = { ...mockRsvp, event: mockEvent };
      (prismaService.eventRsvp.findUnique as jest.Mock).mockResolvedValue(mockRsvpWithEvent);
      (prismaService.eventRsvp.delete as jest.Mock).mockResolvedValue(mockRsvp);
      (prismaService.event.update as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.cancelRsvp('event-1', 'user-456');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if RSVP not found', async () => {
      (prismaService.eventRsvp.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelRsvp('event-1', 'user-456')).rejects.toThrow(NotFoundException);
    });
  });
});
