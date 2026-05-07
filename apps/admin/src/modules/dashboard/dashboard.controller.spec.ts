import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getDashboardStats: jest.fn().mockResolvedValue({
              totalUsers: 0,
              totalContent: 0,
              totalRevenue: 0,
              activeSubscriptions: 0,
            }),
            getRevenueData: jest.fn().mockResolvedValue([]),
            getContentTrend: jest.fn().mockResolvedValue([]),
            getTopContent: jest.fn().mockResolvedValue([]),
            getTopCreators: jest.fn().mockResolvedValue([]),
            getRecentActivity: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return dashboard stats', async () => {
    const result = await controller.getDashboardStats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('totalUsers');
    expect(result).toHaveProperty('totalContent');
    expect(result).toHaveProperty('totalRevenue');
    expect(result).toHaveProperty('activeSubscriptions');
  });

  it('should return revenue data', async () => {
    const result = await controller.getRevenueData(30);
    expect(result).toBeDefined();
  });

  it('should return content trend', async () => {
    const result = await controller.getContentTrend(30);
    expect(result).toBeDefined();
  });

  it('should return top content', async () => {
    const result = await controller.getTopContent(10);
    expect(result).toBeDefined();
  });

  it('should return top creators', async () => {
    const result = await controller.getTopCreators(10);
    expect(result).toBeDefined();
  });

  it('should return recent activity', async () => {
    const result = await controller.getRecentActivity(20);
    expect(result).toBeDefined();
  });
});
