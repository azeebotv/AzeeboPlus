import { Test, TestingModule } from '@nestjs/testing';
import { LiveEventService } from './live-event.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService, liveEventFlags } from '@azeebo/feature-flags';
import axios from 'axios';

jest.mock('axios');

describe('LiveEventService', () => {
  let service: LiveEventService;
  let prisma: {
    liveEvent: { findUnique: jest.Mock; findMany: jest.Mock; count: jest.Mock; create: jest.Mock };
    liveEventTicket: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  };
  let flagService: { isEnabled: jest.Mock };

  const mockEvent = {
    id: 'event-1',
    title: 'Big Show',
    ticketPrice: 5000,
    currency: 'NGN',
    status: 'live',
    streamUrl: 'https://stream.example/live-1',
    chatEnabled: true,
    maxViewers: null,
  };

  beforeEach(async () => {
    prisma = {
      liveEvent: {
        findUnique: jest.fn().mockResolvedValue(mockEvent),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ ...mockEvent, ...data })),
      },
      liveEventTicket: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'ticket-1' }),
      },
    };
    flagService = { isEnabled: jest.fn().mockResolvedValue(true) };
    (axios.post as jest.Mock).mockResolvedValue({ data: {} });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveEventService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: FeatureFlagService, useValue: flagService },
      ],
    }).compile();

    service = module.get<LiveEventService>(LiveEventService);
  });

  describe('live_event_tickets', () => {
    it('rejects ticket purchases when the flag is off', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== liveEventFlags.tickets)
      );

      await expect(service.purchaseTicket('event-1', 'user-1')).rejects.toThrow(
        'Ticket sales are currently disabled'
      );
      expect(prisma.liveEventTicket.create).not.toHaveBeenCalled();
    });

    it('allows ticket purchases when the flag is on', async () => {
      const result = await service.purchaseTicket('event-1', 'user-1');
      expect(result).toBeDefined();
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('live_event_streaming', () => {
    it('rejects stream access when the flag is off', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== liveEventFlags.streaming)
      );

      await expect(service.getStreamUrl('event-1', 'user-1')).rejects.toThrow(
        'Live streaming is currently disabled'
      );
    });

    it('returns the stream URL when the flag is on and the viewer has a ticket', async () => {
      prisma.liveEventTicket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'purchased' });

      const result = await service.getStreamUrl('event-1', 'user-1');
      expect(result.streamUrl).toBe('https://stream.example/live-1');
    });
  });

  describe('live_event_ppv', () => {
    it('requires a ticket for paid events when PPV is on', async () => {
      prisma.liveEventTicket.findFirst.mockResolvedValue(null);

      await expect(service.getStreamUrl('event-1', 'user-1')).rejects.toThrow(
        'You must purchase a ticket to watch this event'
      );
    });

    it('waives the ticket requirement when PPV is off', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== liveEventFlags.ppv)
      );

      const result = await service.getStreamUrl('event-1', 'user-1');
      expect(result.streamUrl).toBe('https://stream.example/live-1');
    });
  });

  describe('live_event_chat', () => {
    it('forces chat off on new events when the flag is off', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== liveEventFlags.chat)
      );

      await service.createEvent({
        title: 'New Show',
        thumbnail: 'thumb.jpg',
        organizerId: 'org-1',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        ticketPrice: 0,
        chatEnabled: true,
      });

      const createCall = prisma.liveEvent.create.mock.calls[0][0];
      expect(createCall.data.chatEnabled).toBe(false);
    });

    it('respects the requested chat setting when the flag is on', async () => {
      await service.createEvent({
        title: 'New Show',
        thumbnail: 'thumb.jpg',
        organizerId: 'org-1',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        ticketPrice: 0,
        chatEnabled: true,
      });

      const createCall = prisma.liveEvent.create.mock.calls[0][0];
      expect(createCall.data.chatEnabled).toBe(true);
    });
  });
});
