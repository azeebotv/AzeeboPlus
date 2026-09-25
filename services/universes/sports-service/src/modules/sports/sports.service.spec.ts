import { Test, TestingModule } from '@nestjs/testing';
import { SportsService } from './sports.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SportsService', () => {
  let service: SportsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportsService,
        {
          provide: PrismaService,
          useValue: {
            highlight: { findMany: jest.fn() },
            sportsEvent: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
            predictionMarket: { findMany: jest.fn() },
            predictionEntry: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            // wallet is accessed via HTTP to wallet-service, not Prisma
            contest: { findUnique: jest.fn(), findMany: jest.fn() },
            contestEntry: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
            fanBoard: { findMany: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            // Fee keys must resolve to NUMBERS or the service's balance check
            // (Number(balance) < fee) silently no-ops — NaN comparisons are
            // always false — and tests only pass via later crashes.
            get: jest.fn(
              (key: string) =>
                ({ PREDICTION_FEE: 10, CONTEST_ENTRY_FEE: 50 })[
                  key as 'PREDICTION_FEE' | 'CONTEST_ENTRY_FEE'
                ] ?? 'test-value'
            ),
            getOrThrow: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<SportsService>(SportsService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHome', () => {
    it('should return highlights, events, and predictions', async () => {
      const mockHighlights = [{ id: 'h1', title: 'Highlight 1' }];
      const mockEvents = [{ id: 'e1', status: 'upcoming' }];
      const mockPredictions = [{ id: 'p1', status: 'active' }];

      (prismaService.highlight.findMany as jest.Mock).mockResolvedValue(mockHighlights);
      (prismaService.sportsEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prismaService.predictionMarket.findMany as jest.Mock).mockResolvedValue(mockPredictions);

      const result = await service.getHome();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        highlights: mockHighlights,
        events: mockEvents,
        predictions: mockPredictions,
      });
    });
  });

  describe('submitPrediction', () => {
    const userId = 'user-123';
    const eventId = 'event-1';
    const predictionBody = { eventId, prediction: { winner: 'Team A' } };

    it('should submit prediction successfully (happy path)', async () => {
      const mockEvent = { id: eventId, status: 'upcoming' };
      const mockWallet = { id: 'wallet-1', userId, balance: '100' };
      const mockPredictionEntry = { id: 'pred-1', userId, eventId };

      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockWallet });
      mockedAxios.post.mockResolvedValue({ data: { balance: 90 } });
      (prismaService.predictionEntry.create as jest.Mock).mockResolvedValue(mockPredictionEntry);

      const result = await service.submitPrediction(userId, predictionBody);

      expect(result.success).toBe(true);
      expect(result.data?.predictionId).toBe('pred-1');
      expect(result.data?.idempotent).toBe(false);
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should throw NotFoundException when event not found', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.submitPrediction(userId, predictionBody)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when event is not upcoming', async () => {
      const mockEvent = { id: eventId, status: 'completed' };
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);

      await expect(service.submitPrediction(userId, predictionBody)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return idempotent response when prediction already exists', async () => {
      const mockEvent = { id: eventId, status: 'upcoming' };
      const mockExistingEntry = { id: 'existing-pred-1', userId, eventId };

      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(mockExistingEntry);

      const result = await service.submitPrediction(userId, predictionBody);

      expect(result.success).toBe(true);
      expect(result.data?.idempotent).toBe(true);
      expect(result.data?.message).toContain('idempotent');
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      const mockEvent = { id: eventId, status: 'upcoming' };
      const mockWallet = { id: 'wallet-1', userId, balance: '5' };

      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockWallet });

      await expect(service.submitPrediction(userId, predictionBody)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should compensate wallet if prediction creation fails', async () => {
      const mockEvent = { id: eventId, status: 'upcoming' };
      const mockWallet = { id: 'wallet-1', userId, balance: '100' };

      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockWallet });
      mockedAxios.post
        .mockResolvedValueOnce({ data: { balance: 90 } })
        .mockRejectedValueOnce(new Error('DB error'));
      (prismaService.predictionEntry.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.submitPrediction(userId, predictionBody)).rejects.toThrow(
        // A Prisma failure after the wallet debit is a server fault (the saga
        // compensates either way) — mapAndThrow maps it honestly to 500.
        InternalServerErrorException
      );

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('enterContest', () => {
    const userId = 'user-123';
    const contestId = 'contest-1';

    it('should enter contest successfully (happy path)', async () => {
      const mockContest = { id: contestId, status: 'active' };
      const mockWallet = { id: 'wallet-1', userId, balance: '100' };
      const mockEntry = { id: 'entry-1', userId, contestId };

      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prismaService.contestEntry.findUnique as jest.Mock).mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({ data: mockWallet });
      mockedAxios.post.mockResolvedValue({ data: { balance: 50 } });
      (prismaService.contestEntry.create as jest.Mock).mockResolvedValue(mockEntry);

      const result = await service.enterContest(userId, contestId);

      expect(result.success).toBe(true);
      expect(result.data!.entryId).toBe('entry-1');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should return idempotent response when already entered', async () => {
      const mockContest = { id: contestId, status: 'active' };
      const mockExistingEntry = { id: 'existing-entry-1', userId, contestId };

      (prismaService.contest.findUnique as jest.Mock).mockResolvedValue(mockContest);
      (prismaService.contestEntry.findUnique as jest.Mock).mockResolvedValue(mockExistingEntry);

      const result = await service.enterContest(userId, contestId);

      expect(result.success).toBe(true);
      expect(result.data!.idempotent).toBe(true);
    });
  });
});
