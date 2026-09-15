import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SportsService } from './sports.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SportsService Integration - Cross-Service Communication', () => {
  let service: SportsService;

  const mockPrismaService = {
    highlight: {
      findMany: jest.fn(),
    },
    sportsEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    predictionMarket: {
      findMany: jest.fn(),
    },
    predictionEntry: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    fanBoard: {
      findMany: jest.fn(),
    },
    contest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    contestEntry: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                PREDICTION_FEE: 10,
                CONTEST_ENTRY_FEE: 50,
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                ANALYTICS_SERVICE_URL: 'http://analytics-service:3040',
                WALLET_SERVICE_URL: 'http://wallet-service:3050',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SportsService>(SportsService);

    jest.clearAllMocks();
  });

  describe('getEvents - Sports Event Listing', () => {
    it('should return events with teams and prediction counts', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'World Cup Final',
          status: 'upcoming',
          startsAt: new Date('2024-07-15'),
          teams: [
            { id: 'team-1', name: 'Brazil' },
            { id: 'team-2', name: 'Argentina' },
          ],
          _count: { predictions: 42 },
        },
      ];

      mockPrismaService.sportsEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEvents();

      expect(result.success).toBe(true);
      expect(result.data?.events).toHaveLength(1);
      expect(result.data?.events?.[0]).toMatchObject({
        id: 'event-1',
        title: 'World Cup Final',
        _count: { predictions: 42 },
      });
    });
  });

  describe('getEventById - Single Event', () => {
    it('should return a single event by id', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'World Cup Final',
        status: 'upcoming',
        startsAt: new Date('2024-07-15'),
        teams: [],
        _count: { predictions: 10 },
      };

      mockPrismaService.sportsEvent.findUnique.mockResolvedValue(mockEvent);

      const result = await service.getEventById('event-1');

      expect(result.success).toBe(true);
      expect(result.data?.event).toMatchObject({
        id: 'event-1',
        title: 'World Cup Final',
      });
    });

    it('should throw NotFoundException for unknown event', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue(null);

      await expect(service.getEventById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitPrediction - Wallet + Analytics Integration', () => {
    it('should successfully debit wallet and create prediction', async () => {
      const userId = 'user-1';
      const eventId = 'event-1';

      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: eventId,
        status: 'upcoming',
        startsAt: new Date('2099-01-01'),
      });
      mockPrismaService.predictionEntry.findFirst.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 100 },
      });

      mockedAxios.post.mockResolvedValue({
        data: { success: true, balance: 90 },
      });

      mockPrismaService.predictionEntry.create.mockResolvedValue({
        id: 'pred-1',
        userId,
        eventId,
        prediction: { winner: 'Brazil' },
      });

      const result = await service.submitPrediction(userId, {
        eventId,
        prediction: { winner: 'Brazil' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.predictionId).toBe('pred-1');
      expect(result.data?.idempotent).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/debit'),
        expect.objectContaining({
          amount: 10,
          description: expect.stringContaining(eventId),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw NotFoundException when event does not exist', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.submitPrediction('user-1', {
          eventId: 'nonexistent',
          prediction: { winner: 'Brazil' },
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when event is not upcoming', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'completed',
        startsAt: new Date('2024-01-01'),
      });

      await expect(
        service.submitPrediction('user-1', {
          eventId: 'event-1',
          prediction: { winner: 'Brazil' },
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when event has already started', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
        startsAt: new Date('2020-01-01'),
      });

      await expect(
        service.submitPrediction('user-1', {
          eventId: 'event-1',
          prediction: { winner: 'Brazil' },
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should return idempotent response when prediction already exists', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
        startsAt: new Date('2099-01-01'),
      });
      mockPrismaService.predictionEntry.findFirst.mockResolvedValue({
        id: 'pred-existing',
        userId: 'user-1',
        eventId: 'event-1',
      });

      const result = await service.submitPrediction('user-1', {
        eventId: 'event-1',
        prediction: { winner: 'Brazil' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.idempotent).toBe(true);
      expect(result.data?.predictionId).toBe('pred-existing');
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
        startsAt: new Date('2099-01-01'),
      });
      mockPrismaService.predictionEntry.findFirst.mockResolvedValue(null);

      mockedAxios.get.mockRejectedValue(new Error('Wallet service unavailable'));

      await expect(
        service.submitPrediction('user-1', {
          eventId: 'event-1',
          prediction: { winner: 'Brazil' },
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
        startsAt: new Date('2099-01-01'),
      });
      mockPrismaService.predictionEntry.findFirst.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 5 },
      });

      await expect(
        service.submitPrediction('user-1', {
          eventId: 'event-1',
          prediction: { winner: 'Brazil' },
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should compensate wallet when prediction creation fails after debit', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
        startsAt: new Date('2099-01-01'),
      });
      mockPrismaService.predictionEntry.findFirst.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 100 },
      });

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { success: true, balance: 90 },
        })
        .mockResolvedValueOnce({
          data: { success: true },
        });

      mockPrismaService.predictionEntry.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.submitPrediction('user-1', {
          eventId: 'event-1',
          prediction: { winner: 'Brazil' },
        })
        // A Prisma failure after the wallet debit is a server fault (the saga
        // compensates either way) — mapAndThrow maps it honestly to 500.
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/credit'),
        expect.objectContaining({
          description: expect.stringContaining('Compensation'),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });
  });

  describe('getLeaderboard - Data Aggregation', () => {
    it('should return leaderboard grouped by user', async () => {
      const mockLeaderboard = [
        { userId: 'user-1', _sum: { points: 300 } },
        { userId: 'user-2', _sum: { points: 200 } },
        { userId: 'user-3', _sum: { points: 100 } },
      ];

      mockPrismaService.predictionEntry.groupBy.mockResolvedValue(mockLeaderboard);

      const result = await service.getLeaderboard();

      expect(result.success).toBe(true);
      expect(result.data?.leaderboard).toHaveLength(3);
    });
  });

  describe('enterContest - Wallet + Analytics Integration', () => {
    it('should successfully debit wallet and create contest entry', async () => {
      const userId = 'user-1';
      const contestId = 'contest-1';

      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: contestId,
        status: 'active',
        endsAt: new Date('2099-12-31'),
      });
      mockPrismaService.contestEntry.findUnique.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 100 },
      });

      mockedAxios.post.mockResolvedValue({
        data: { success: true, balance: 50 },
      });

      mockPrismaService.contestEntry.create.mockResolvedValue({
        id: 'entry-1',
        userId,
        contestId,
        entryData: { fee: 50 },
      });

      const result = await service.enterContest(userId, contestId);

      expect(result.success).toBe(true);
      expect(result.data?.entryId).toBe('entry-1');
      expect(result.data?.idempotent).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/debit'),
        expect.objectContaining({
          amount: 50,
          description: expect.stringContaining(contestId),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw NotFoundException when contest does not exist', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue(null);

      await expect(service.enterContest('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when contest is not active', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: 'contest-1',
        status: 'ended',
        endsAt: new Date('2024-01-01'),
      });

      await expect(service.enterContest('user-1', 'contest-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when contest has already ended', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        endsAt: new Date('2020-01-01'),
      });

      await expect(service.enterContest('user-1', 'contest-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return idempotent response when already entered', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        endsAt: new Date('2099-12-31'),
      });
      mockPrismaService.contestEntry.findUnique.mockResolvedValue({
        id: 'entry-existing',
        userId: 'user-1',
        contestId: 'contest-1',
      });

      const result = await service.enterContest('user-1', 'contest-1');

      expect(result.success).toBe(true);
      expect(result.data?.idempotent).toBe(true);
      expect(result.data?.entryId).toBe('entry-existing');
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        endsAt: new Date('2099-12-31'),
      });
      mockPrismaService.contestEntry.findUnique.mockResolvedValue(null);

      mockedAxios.get.mockRejectedValue(new Error('Wallet service unavailable'));

      await expect(service.enterContest('user-1', 'contest-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        endsAt: new Date('2099-12-31'),
      });
      mockPrismaService.contestEntry.findUnique.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 10 },
      });

      await expect(service.enterContest('user-1', 'contest-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should compensate wallet when contest entry creation fails', async () => {
      mockPrismaService.contest.findUnique.mockResolvedValue({
        id: 'contest-1',
        status: 'active',
        endsAt: new Date('2099-12-31'),
      });
      mockPrismaService.contestEntry.findUnique.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 100 },
      });

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { success: true, balance: 50 },
        })
        .mockResolvedValueOnce({
          data: { success: true },
        });

      mockPrismaService.contestEntry.create.mockRejectedValue(new Error('DB error'));

      // A Prisma failure after the wallet debit is a server fault (the saga
      // compensates either way) — mapAndThrow maps it honestly to 500.
      await expect(service.enterContest('user-1', 'contest-1')).rejects.toThrow(
        InternalServerErrorException
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/credit'),
        expect.objectContaining({
          description: expect.stringContaining('Compensation'),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });
  });

  describe('Error Handling - Service Resilience', () => {
    it('should handle analytics service failure gracefully during prediction', async () => {
      mockPrismaService.sportsEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
        startsAt: new Date('2099-01-01'),
      });
      mockPrismaService.predictionEntry.findFirst.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: { id: 'wallet-1', balance: 100 },
      });

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { success: true, balance: 90 },
        })
        .mockRejectedValueOnce(new Error('Analytics service down'));

      mockPrismaService.predictionEntry.create.mockResolvedValue({
        id: 'pred-1',
        userId: 'user-1',
        eventId: 'event-1',
        prediction: { winner: 'Brazil' },
      });

      const result = await service.submitPrediction('user-1', {
        eventId: 'event-1',
        prediction: { winner: 'Brazil' },
      });

      expect(result.success).toBe(true);
    });
  });
});
