import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * The governance summary drives the Executive Dashboard card: wrong counts
 * here mean missed approvals or unlicensed content slipping through, so the
 * tests pin the exact status windows the card promises.
 */
describe('DashboardService — governance summary', () => {
  let service: DashboardService;
  let prisma: {
    dualControlRequest: { count: jest.Mock };
    rightsClearance: { count: jest.Mock };
    // Other DashboardService methods touch these; provide benign stubs.
    user: { count: jest.Mock; findMany: jest.Mock };
    contentItem: { count: jest.Mock; aggregate: jest.Mock; findMany: jest.Mock };
    report: { count: jest.Mock; findMany: jest.Mock };
    wallet: { count: jest.Mock };
    walletTransaction: { aggregate: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      dualControlRequest: { count: jest.fn().mockResolvedValue(0) },
      rightsClearance: { count: jest.fn().mockResolvedValue(0) },
      user: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      contentItem: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { viewCount: 0 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      report: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      wallet: { count: jest.fn().mockResolvedValue(0) },
      walletTransaction: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DashboardService);
  });

  it('counts pending + first_approved as pending dual-control work', async () => {
    prisma.dualControlRequest.count
      .mockResolvedValueOnce(3) // pending/first_approved
      .mockResolvedValueOnce(1); // approved not executed

    const result = await service.getGovernanceSummary();

    expect(prisma.dualControlRequest.count).toHaveBeenNthCalledWith(1, {
      where: { status: { in: ['pending', 'first_approved'] } },
    });
    expect(prisma.dualControlRequest.count).toHaveBeenNthCalledWith(2, {
      where: { status: 'approved' },
    });
    expect(result.pendingDualControl).toBe(3);
    expect(result.approvedNotExecuted).toBe(1);
  });

  it('counts only live clearances expiring within 30 days', async () => {
    prisma.rightsClearance.count
      .mockResolvedValueOnce(5) // expiring window
      .mockResolvedValueOnce(2); // already expired

    const result = await service.getGovernanceSummary();

    expect(prisma.rightsClearance.count).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['pending', 'approved'] },
          expiryDate: expect.objectContaining({ gt: expect.any(Date), lte: expect.any(Date) }),
        }),
      })
    );
    // The expiry window is "now → +30 days": upper bound must be ~30 days out.
    const where = prisma.rightsClearance.count.mock.calls[0][0].where;
    const days = (where.expiryDate.lte.getTime() - where.expiryDate.gt.getTime()) / 86400000;
    expect(days).toBeCloseTo(30, 5);
    expect(result.expiringClearances).toBe(5);
    expect(result.expiredClearances).toBe(2);
  });

  it('treats expired-but-not-rejected clearances as exposure', async () => {
    prisma.rightsClearance.count.mockResolvedValueOnce(0).mockResolvedValueOnce(4);

    const result = await service.getGovernanceSummary();

    expect(prisma.rightsClearance.count).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['pending', 'approved'] },
          expiryDate: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      })
    );
    expect(result.expiredClearances).toBe(4);
  });

  it('returns all zeros on an empty governance queue', async () => {
    const result = await service.getGovernanceSummary();

    expect(result).toEqual({
      pendingDualControl: 0,
      approvedNotExecuted: 0,
      expiringClearances: 0,
      expiredClearances: 0,
    });
  });
});
