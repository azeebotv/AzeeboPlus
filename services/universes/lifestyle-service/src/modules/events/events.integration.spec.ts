import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import axios from 'axios';

jest.mock('zod', () => {
  const chainable = () => {
    const obj: Record<string, jest.Mock> = {};
    const methods = [
      'optional',
      'default',
      'url',
      'email',
      'min',
      'max',
      'positive',
      'transform',
      'regex',
      'nullable',
      'trim',
      'safeParse',
    ];
    methods.forEach((m) => {
      obj[m] = jest.fn().mockReturnValue(obj);
    });
    return obj;
  };
  const z = {
    string: jest.fn(() => chainable()),
    number: jest.fn(() => chainable()),
    boolean: jest.fn(() => chainable()),
    array: jest.fn(() => chainable()),
    object: jest.fn(() => chainable()),
    enum: jest.fn(() => chainable()),
    record: jest.fn(() => chainable()),
    literal: jest.fn(() => chainable()),
    union: jest.fn(() => chainable()),
    any: jest.fn(() => chainable()),
    coerce: { string: jest.fn(() => chainable()), number: jest.fn(() => chainable()) },
  };
  return { z, ZodError: class ZodError extends Error {} };
});

jest.mock('firebase-admin/app', () => ({ initializeApp: jest.fn(), cert: jest.fn() }));
jest.mock('firebase-admin/messaging', () => ({}));
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EventsService Integration - Cross-Service Communication', () => {
  let service: EventsService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrismaService: Record<string, any> = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    eventRsvp: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    eventCategory: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn: unknown) =>
      typeof fn === 'function'
        ? (fn as (tx: unknown) => unknown)(mockPrismaService)
        : Promise.all(fn as unknown[])
    ) as jest.Mock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as Record<string, any>;

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
    invalidate: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                ANALYTICS_SERVICE_URL: 'http://analytics-service:3040',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);

    jest.clearAllMocks();
  });

  describe('createEvent - Event Creation', () => {
    it('should successfully create an event', async () => {
      const createEventData = {
        title: 'Summer Music Festival',
        description: 'A weekend of live music',
        startDate: '2026-08-15T18:00:00.000Z',
        endDate: '2026-08-17T23:00:00.000Z',
        location: 'Central Park',
        venue: 'Main Stage',
        creatorId: 'user-1',
      };

      mockPrismaService.event.create.mockResolvedValue({
        id: 'event-1',
        title: 'Summer Music Festival',
        slug: 'summer-music-festival',
        description: 'A weekend of live music',
        coverImage: null,
        startDate: new Date('2026-08-15T18:00:00.000Z'),
        endDate: new Date('2026-08-17T23:00:00.000Z'),
        location: 'Central Park',
        venue: 'Main Stage',
        isOnline: false,
        onlineLink: null,
        maxAttendees: null,
        status: 'draft',
        categoryId: null,
        creatorId: 'user-1',
        viewCount: 0,
        rsvpCount: 0,
        publishedAt: null,
        createdAt: new Date(),
        category: { name: 'General' },
      });

      const result = await service.createEvent(createEventData);

      expect(result.success).toBe(true);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Summer Music Festival',
            slug: 'summer-music-festival',
            status: 'draft',
          }),
        })
      );
    });

    it('should generate correct slug from title', async () => {
      mockPrismaService.event.create.mockResolvedValue({
        id: 'event-1',
        title: 'Comedy Night @ The Hub!',
        slug: 'comedy-night-the-hub',
        description: 'Night of laughs',
        coverImage: null,
        startDate: new Date(),
        endDate: null,
        location: null,
        venue: null,
        isOnline: false,
        onlineLink: null,
        maxAttendees: null,
        status: 'draft',
        categoryId: null,
        creatorId: 'user-1',
        viewCount: 0,
        rsvpCount: 0,
        publishedAt: null,
        createdAt: new Date(),
        category: { name: 'General' },
      });

      await service.createEvent({
        title: 'Comedy Night @ The Hub!',
        description: 'Night of laughs',
        startDate: '2026-09-01T20:00:00.000Z',
        creatorId: 'user-1',
      });

      expect(mockPrismaService.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'comedy-night-the-hub',
          }),
        })
      );
    });
  });

  describe('rsvpEvent - RSVP to Event', () => {
    it('should successfully RSVP to an event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        slug: 'summer-fest',
        maxAttendees: 100,
        rsvpCount: 50,
        rsvps: [],
      });
      mockPrismaService.eventRsvp.findUnique.mockResolvedValue(null);
      mockPrismaService.eventRsvp.create.mockResolvedValue({
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: 'attending',
        guests: 0,
        note: null,
        createdAt: new Date(),
        event: { slug: 'summer-fest' },
      });

      const result = await service.rsvpEvent('event-1', 'user-1', {
        status: 'attending',
        guests: 0,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.eventRsvp.create).toHaveBeenCalled();
      expect(mockPrismaService.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          data: { rsvpCount: { increment: 1 } },
        })
      );
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          eventName: 'event_rsvp_created',
          userId: 'user-1',
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.rsvpEvent('nonexistent-event', 'user-1', {})).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when already RSVPed', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        slug: 'summer-fest',
        maxAttendees: 100,
        rsvpCount: 50,
        rsvps: [],
      });
      mockPrismaService.eventRsvp.findUnique.mockResolvedValue({
        id: 'rsvp-existing',
        userId: 'user-1',
        eventId: 'event-1',
      });

      await expect(service.rsvpEvent('event-1', 'user-1', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when event is fully booked', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        slug: 'summer-fest',
        maxAttendees: 100,
        rsvpCount: 100,
        rsvps: [],
      });
      mockPrismaService.eventRsvp.findUnique.mockResolvedValue(null);

      await expect(service.rsvpEvent('event-1', 'user-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelRsvp - Cancel RSVP', () => {
    it('should successfully cancel an RSVP', async () => {
      mockPrismaService.eventRsvp.findUnique.mockResolvedValue({
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: 'event-1',
        event: { slug: 'summer-fest' },
      });

      const result = await service.cancelRsvp('event-1', 'user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.eventRsvp.delete).toHaveBeenCalled();
      expect(mockPrismaService.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          data: { rsvpCount: { decrement: 1 } },
        })
      );
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          eventName: 'event_rsvp_cancelled',
          userId: 'user-1',
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw NotFoundException when RSVP does not exist', async () => {
      mockPrismaService.eventRsvp.findUnique.mockResolvedValue(null);

      await expect(service.cancelRsvp('event-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEventBySlug - Event Retrieval', () => {
    it('should return event by slug with RSVPs', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        title: 'Summer Festival',
        slug: 'summer-festival',
        description: 'Great event',
        coverImage: 'https://example.com/cover.jpg',
        startDate: new Date('2026-08-15T18:00:00.000Z'),
        endDate: new Date('2026-08-17T23:00:00.000Z'),
        location: 'Central Park',
        venue: 'Main Stage',
        isOnline: false,
        onlineLink: null,
        maxAttendees: 200,
        status: 'published',
        categoryId: 'cat-1',
        creatorId: 'user-1',
        viewCount: 150,
        rsvpCount: 45,
        publishedAt: new Date('2026-07-01T00:00:00.000Z'),
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        category: { name: 'Music' },
        rsvps: [
          {
            id: 'rsvp-1',
            userId: 'user-2',
            eventId: 'event-1',
            status: 'attending',
            guests: 2,
            note: 'Looking forward!',
            createdAt: new Date('2026-07-10T00:00:00.000Z'),
          },
        ],
      });

      const result = await service.getEventBySlug('summer-festival');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.getEventBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return cached result when available', async () => {
      const cachedEvent = {
        id: 'event-1',
        title: 'Cached Event',
        slug: 'cached-event',
        rsvps: [],
      };
      mockCacheService.get.mockResolvedValue(cachedEvent);

      const result = await service.getEventBySlug('cached-event');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedEvent);
      expect(mockPrismaService.event.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling - Service Resilience', () => {
    it('should handle analytics service failure gracefully on RSVP', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: 'event-1',
        slug: 'summer-fest',
        maxAttendees: 100,
        rsvpCount: 50,
        rsvps: [],
      });
      mockPrismaService.eventRsvp.findUnique.mockResolvedValue(null);
      mockPrismaService.eventRsvp.create.mockResolvedValue({
        id: 'rsvp-1',
        userId: 'user-1',
        eventId: 'event-1',
        status: 'attending',
        guests: 0,
        note: null,
        createdAt: new Date(),
        event: { slug: 'summer-fest' },
      });

      mockedAxios.post.mockRejectedValue(new Error('Analytics service down'));

      const result = await service.rsvpEvent('event-1', 'user-1', {});

      expect(result.success).toBe(true);
    });

    it('should return error response when event creation fails', async () => {
      mockPrismaService.event.create.mockRejectedValue(new Error('Database error'));

      const result = await service.createEvent({
        title: 'Test Event',
        description: 'Test',
        startDate: '2026-08-15T18:00:00.000Z',
        creatorId: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
