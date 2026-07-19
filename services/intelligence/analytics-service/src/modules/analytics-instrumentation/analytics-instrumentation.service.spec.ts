import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsInstrumentationService } from './analytics-instrumentation.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('AnalyticsInstrumentationService', () => {
  let service: AnalyticsInstrumentationService;

  const mockPrismaService = {
    productEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsInstrumentationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AnalyticsInstrumentationService>(AnalyticsInstrumentationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('track', () => {
    it('should track an event', async () => {
      mockPrismaService.productEvent.create.mockResolvedValue({ id: '1' });

      const result = await service.track({
        eventName: 'test_event',
        userId: 'user-1',
        timestamp: new Date(),
      });
      expect(result).toBeDefined();
      expect(mockPrismaService.productEvent.create).toHaveBeenCalled();
    });
  });
});
