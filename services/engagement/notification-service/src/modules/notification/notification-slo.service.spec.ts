import { Test, TestingModule } from '@nestjs/testing';
import { NotificationSLOService } from './notification-slo.service';
import { PrismaService } from '../database/prisma.service';

describe('NotificationSLOService', () => {
  let service: NotificationSLOService;

  const mockPrisma = {
    notification: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationSLOService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<NotificationSLOService>(NotificationSLOService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('measureSLO', () => {
    it('should return SLO measurement', async () => {
      mockPrisma.notification.count.mockResolvedValue(1000);

      const start = new Date('2024-01-01');
      const end = new Date('2024-01-07');

      const result = await service.measureSLO(start, end);

      expect(result.totalNotifications).toBe(1000);
      expect(result.sliTarget).toBe(0.95);
      expect(result.byChannel).toHaveProperty('push');
      expect(result.byChannel).toHaveProperty('email');
      expect(result.byChannel).toHaveProperty('sms');
      expect(result.byChannel).toHaveProperty('in_app');
    });

    it('should return zero for empty period', async () => {
      mockPrisma.notification.count.mockResolvedValue(0);

      const result = await service.measureSLO(new Date(), new Date());

      expect(result.totalNotifications).toBe(0);
    });
  });

  describe('getCurrentSLOStatus', () => {
    it('should return current SLO status', async () => {
      mockPrisma.notification.count.mockResolvedValue(500);

      const result = await service.getCurrentSLOStatus();

      expect(result.sloMet).toBeDefined();
      expect(result.alertThreshold).toBe(0.95);
    });
  });
});
