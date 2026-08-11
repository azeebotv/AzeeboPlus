import { Test, TestingModule } from '@nestjs/testing';
import { PredictionMarketsService } from './prediction-markets.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
jest.mock('../database/prisma.service');

describe('PredictionMarketsService', () => {
  let service: PredictionMarketsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockMarket = {
    id: 'market-1',
    eventId: 'event-1',
    question: 'Will Team A win?',
    options: ['Yes', 'No'],
    odds: { Yes: 1.5, No: 2.5 },
    status: 'active',
    totalPool: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    event: {
      id: 'event-1',
      sport: 'football',
      status: 'upcoming',
      teams: [],
    },
    _count: { entries: 10 },
  };

  const mockEntry = {
    id: 'entry-1',
    userId: 'user-1',
    eventId: 'event-1',
    prediction: { selectedOption: 'Yes', stake: 10 },
    predictionMarketId: 'market-1',
    points: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    event: { id: 'event-1', teams: [] },
    PredictionMarket: mockMarket,
  };

  const mockWallet = { id: 'wallet-1', balance: 5000 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionMarketsService,
        {
          provide: PrismaService,
          useValue: {
            predictionMarket: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            predictionEntry: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            sportsEvent: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
            getOrThrow: jest.fn((_key: string) => 'http://mock-service:3000'),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<PredictionMarketsService>(PredictionMarketsService);
    prismaService = module.get(PrismaService);

    jest.spyOn(axios, 'get').mockResolvedValue({ data: { id: 'wallet-1', balance: 5000 } });
    jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPredictionMarkets', () => {
    it('should return paginated prediction markets', async () => {
      (prismaService.predictionMarket.findMany as jest.Mock).mockResolvedValue([mockMarket]);
      (prismaService.predictionMarket.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getPredictionMarkets(1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items');
      expect(result.data).toHaveProperty('total');
    });

    it('should apply sport filter', async () => {
      (prismaService.predictionMarket.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.predictionMarket.count as jest.Mock).mockResolvedValue(0);

      await service.getPredictionMarkets(1, 20, 'football');

      expect(prismaService.predictionMarket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            event: { sport: 'football' },
          }),
        })
      );
    });

    it('should apply status filter', async () => {
      (prismaService.predictionMarket.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.predictionMarket.count as jest.Mock).mockResolvedValue(0);

      await service.getPredictionMarkets(1, 20, undefined, 'active');

      expect(prismaService.predictionMarket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should throw on error', async () => {
      (prismaService.predictionMarket.findMany as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      await expect(service.getPredictionMarkets()).rejects.toThrow();
    });
  });

  describe('getMarketById', () => {
    it('should return a market by ID', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);

      const result = await service.getMarketById('market-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMarket);
    });

    it('should throw NotFoundException if market not found', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMarketById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPredictionMarket', () => {
    it('should create a new prediction market', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.predictionMarket.create as jest.Mock).mockResolvedValue(mockMarket);

      const result = await service.createPredictionMarket(
        'event-1',
        'Will Team A win?',
        ['Yes', 'No']
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('marketId');
    });

    it('should throw NotFoundException if event not found', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createPredictionMarket('nonexistent', 'Question', ['Yes', 'No'])
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if market already exists for event', async () => {
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);

      await expect(
        service.createPredictionMarket('event-1', 'Question', ['Yes', 'No'])
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('placePrediction', () => {
    it('should place a prediction successfully', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
      });
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: mockWallet });
      (prismaService.predictionMarket.update as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.predictionEntry.create as jest.Mock).mockResolvedValue(mockEntry);
      (axios.post as jest.Mock).mockResolvedValue({ data: {} });

      const result = await service.placePrediction('user-1', 'market-1', 'Yes', 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('entryId');
    });

    it('should throw NotFoundException if market not found', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.placePrediction('user-1', 'nonexistent', 'Yes')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if market is not active', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue({
        ...mockMarket,
        status: 'settled',
      });

      await expect(
        service.placePrediction('user-1', 'market-1', 'Yes')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event has already started', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        status: 'live',
      });

      await expect(
        service.placePrediction('user-1', 'market-1', 'Yes')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already has a prediction', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
      });
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(mockEntry);

      await expect(
        service.placePrediction('user-1', 'market-1', 'Yes')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
      });
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: null });

      await expect(
        service.placePrediction('user-1', 'market-1', 'Yes')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
      });
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: { id: 'wallet-1', balance: 1 } });

      await expect(
        service.placePrediction('user-1', 'market-1', 'Yes', 100)
      ).rejects.toThrow(BadRequestException);
    });

    it('should compensate wallet on DB failure', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.sportsEvent.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        status: 'upcoming',
      });
      (prismaService.predictionEntry.findFirst as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: mockWallet });
      (prismaService.predictionMarket.update as jest.Mock).mockResolvedValue(mockMarket);
      (prismaService.predictionEntry.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        service.placePrediction('user-1', 'market-1', 'Yes', 10)
      ).rejects.toThrow();

      // Verify compensation call was made
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/credit'),
        expect.objectContaining({
          description: expect.stringContaining('Refund'),
        }),
        expect.any(Object)
      );
    });
  });

  describe('settleMarket', () => {
    it('should settle market and credit winners', async () => {
      const marketWithEntries = {
        ...mockMarket,
        entries: [
          { ...mockEntry, prediction: { selectedOption: 'Yes' } },
          { ...mockEntry, id: 'entry-2', userId: 'user-2', prediction: { selectedOption: 'No' } },
        ],
      };
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(marketWithEntries);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          predictionMarket: { update: jest.fn() },
          predictionEntry: { update: jest.fn() },
        };
        return cb(tx);
      });
      (axios.get as jest.Mock).mockResolvedValue({ data: mockWallet });

      const result = await service.settleMarket('market-1', 'Yes');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('winners', 1);
      expect(result.data).toHaveProperty('totalDistributed', 100);
    });

    it('should throw NotFoundException if market not found', async () => {
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.settleMarket('nonexistent', 'Yes')).rejects.toThrow(NotFoundException);
    });

    it('should handle no winners gracefully', async () => {
      const marketWithEntries = {
        ...mockMarket,
        entries: [
          { ...mockEntry, prediction: { selectedOption: 'No' } },
        ],
      };
      (prismaService.predictionMarket.findUnique as jest.Mock).mockResolvedValue(marketWithEntries);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => {
        const tx = {
          predictionMarket: { update: jest.fn() },
          predictionEntry: { update: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.settleMarket('market-1', 'Yes');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('winners', 0);
      expect(result.data).toHaveProperty('totalDistributed', 0);
    });
  });

  describe('getUserPredictions', () => {
    it('should return paginated user predictions', async () => {
      (prismaService.predictionEntry.findMany as jest.Mock).mockResolvedValue([mockEntry]);
      (prismaService.predictionEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getUserPredictions('user-1', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('items');
      expect(result.data).toHaveProperty('total');
    });

    it('should throw on error', async () => {
      (prismaService.predictionEntry.findMany as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      await expect(service.getUserPredictions('user-1')).rejects.toThrow();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with user data', async () => {
      (prismaService.predictionEntry.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _sum: { points: 300 }, _count: 3 },
      ]);
      (axios.get as jest.Mock).mockResolvedValue({
        data: { id: 'user-1', displayName: 'Champion', avatar: 'avatar.png' },
      });

      const result = await service.getLeaderboard();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      const first = (result.data as Array<Record<string, unknown>>)[0];
      expect(first).toHaveProperty('rank', 1);
      expect(first).toHaveProperty('displayName', 'Champion');
    });

    it('should handle empty leaderboard', async () => {
      (prismaService.predictionEntry.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await service.getLeaderboard();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should throw on error', async () => {
      (prismaService.predictionEntry.groupBy as jest.Mock).mockRejectedValue(
        new Error('DB error')
      );

      await expect(service.getLeaderboard()).rejects.toThrow();
    });
  });
});
