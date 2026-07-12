import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrismaService = {
    subscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    watchHistory: {
      count: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    savedItem: {
      count: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    following: {
      count: jest.fn(),
    },
    contentItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    moderationReport: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    creatorVerification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Subscriptions', () => {
    describe('getAllSubscriptions', () => {
      it('should return paginated subscriptions', async () => {
        const mockSubscriptions = [{ id: 'sub-1', status: 'active' }];
        mockPrismaService.subscription.findMany.mockResolvedValue(mockSubscriptions);
        mockPrismaService.subscription.count.mockResolvedValue(1);

        const result = await service.getAllSubscriptions({ page: 1, limit: 20 });

        expect(result.subscriptions).toHaveLength(1);
        expect(result.meta.total).toBe(1);
      });

      it('should filter by status', async () => {
        mockPrismaService.subscription.findMany.mockResolvedValue([]);
        mockPrismaService.subscription.count.mockResolvedValue(0);

        await service.getAllSubscriptions({ status: 'active' });

        expect(mockPrismaService.subscription.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { status: 'active' } })
        );
      });
    });

    describe('getSubscriptionById', () => {
      it('should return subscription by id', async () => {
        mockPrismaService.subscription.findUnique.mockResolvedValue({ id: 'sub-1' });

        const result = await service.getSubscriptionById('sub-1');

        expect(result.id).toBe('sub-1');
      });

      it('should throw NotFoundException if not found', async () => {
        mockPrismaService.subscription.findUnique.mockResolvedValue(null);

        await expect(service.getSubscriptionById('not-found')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSubscription', () => {
      it('should update subscription and log audit', async () => {
        mockPrismaService.subscription.findUnique.mockResolvedValue({
          id: 'sub-1',
          status: 'active',
        });
        mockPrismaService.subscription.update.mockResolvedValue({
          id: 'sub-1',
          status: 'cancelled',
        });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.updateSubscription(
          'sub-1',
          { status: 'cancelled' },
          'admin-1',
          'super_admin'
        );

        expect(result.status).toBe('cancelled');
        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });

    describe('deleteSubscription', () => {
      it('should delete subscription and log audit', async () => {
        mockPrismaService.subscription.findUnique.mockResolvedValue({
          id: 'sub-1',
          userId: 'user-1',
        });
        mockPrismaService.subscription.delete.mockResolvedValue({ id: 'sub-1' });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.deleteSubscription('sub-1', 'admin-1', 'super_admin');

        expect(result.message).toBe('Subscription deleted successfully');
        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });
  });

  describe('User Management', () => {
    describe('getUserById', () => {
      it('should return user with follower/following counts', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user' });
        mockPrismaService.following.count.mockResolvedValue(10);

        const result = await service.getUserById('user-1');

        expect(result.id).toBe('user-1');
        expect(result.followerCount).toBe(10);
      });

      it('should throw NotFoundException if user not found', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(service.getUserById('not-found')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateUser', () => {
      it('should update user and log audit', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user' });
        mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', role: 'creator' });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.updateUser(
          'user-1',
          { role: 'creator' },
          'admin-1',
          'super_admin'
        );

        expect(result.role).toBe('creator');
        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });

    describe('suspendUser', () => {
      it('should suspend user and log audit', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user' });
        mockPrismaService.user.update.mockResolvedValue({ id: 'user-1', role: 'suspended' });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.suspendUser(
          'user-1',
          'Violation of terms',
          'admin-1',
          'super_admin'
        );

        expect(result.role).toBe('suspended');
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ action: 'user.suspended' }) })
        );
      });
    });
  });

  describe('Content Moderation', () => {
    describe('moderateContent', () => {
      it('should throw NotFoundException (handled by content-service)', async () => {
        await expect(
          service.moderateContent('content-1', 'approve', 'Looks good', 'admin-1', 'super_admin')
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getModerationReports', () => {
      it('should throw NotFoundException (handled by moderation-service)', async () => {
        await expect(service.getModerationReports(1, 20)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException with status filter', async () => {
        await expect(service.getModerationReports(1, 20, 'pending')).rejects.toThrow(
          NotFoundException
        );
      });
    });

    describe('resolveReport', () => {
      it('should throw NotFoundException (handled by moderation-service)', async () => {
        await expect(
          service.resolveReport('report-1', 'Content removed', 'admin-1', 'super_admin')
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Audit Logs', () => {
    describe('getAuditLogs', () => {
      it('should return paginated audit logs', async () => {
        mockPrismaService.auditLog.findMany.mockResolvedValue([{ id: 'log-1' }]);
        mockPrismaService.auditLog.count.mockResolvedValue(1);

        const result = await service.getAuditLogs(1, 20);

        expect(result.logs).toHaveLength(1);
        expect(result.meta.total).toBe(1);
      });

      it('should filter by userId', async () => {
        mockPrismaService.auditLog.findMany.mockResolvedValue([]);
        mockPrismaService.auditLog.count.mockResolvedValue(0);

        await service.getAuditLogs(1, 20, 'user-1');

        expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { actorId: 'user-1' } })
        );
      });
    });
  });

  describe('Creator Verification', () => {
    describe('getVerificationRequests', () => {
      it('should throw NotFoundException (handled by creator-service)', async () => {
        await expect(service.getVerificationRequests(1, 20)).rejects.toThrow(NotFoundException);
      });
    });

    describe('verifyCreator', () => {
      it('should throw NotFoundException (handled by creator-service)', async () => {
        await expect(
          service.verifyCreator('req-1', 'approved', 'Verified', 'admin-1', 'super_admin')
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('User Data Management', () => {
    describe('deleteWatchHistory', () => {
      it('should delete specific watch history item', async () => {
        mockPrismaService.watchHistory.findUnique.mockResolvedValue({
          userId: 'user-1',
          contentId: 'content-1',
        });
        mockPrismaService.watchHistory.delete.mockResolvedValue({
          userId: 'user-1',
          contentId: 'content-1',
        });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.deleteWatchHistory(
          'user-1',
          'content-1',
          'admin-1',
          'super_admin'
        );

        expect(result.message).toBe('Watch history deleted successfully');
      });

      it('should delete all watch history when no contentId', async () => {
        mockPrismaService.watchHistory.count.mockResolvedValue(5);
        mockPrismaService.watchHistory.deleteMany.mockResolvedValue({ count: 5 });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.deleteWatchHistory(
          'user-1',
          undefined,
          'admin-1',
          'super_admin'
        );

        expect(result.message).toBe('Watch history deleted successfully');
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ action: 'user.watch_history.deleted' }),
          })
        );
      });
    });

    describe('deleteSavedItems', () => {
      it('should delete specific saved item', async () => {
        mockPrismaService.savedItem.findUnique.mockResolvedValue({
          userId: 'user-1',
          contentId: 'content-1',
        });
        mockPrismaService.savedItem.delete.mockResolvedValue({
          userId: 'user-1',
          contentId: 'content-1',
        });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.deleteSavedItems(
          'user-1',
          'content-1',
          'admin-1',
          'super_admin'
        );

        expect(result.message).toBe('Saved items deleted successfully');
      });
    });
  });

  describe('User Preferences', () => {
    describe('getUserPreferences', () => {
      it('should return user preferences', async () => {
        mockPrismaService.userPreferences.findUnique.mockResolvedValue({
          userId: 'user-1',
          darkMode: true,
          notifications: {},
          contentPreferences: {},
        });

        const result = await service.getUserPreferences('user-1');

        expect(result.darkMode).toBe(true);
      });

      it('should throw NotFoundException if not found', async () => {
        mockPrismaService.userPreferences.findUnique.mockResolvedValue(null);

        await expect(service.getUserPreferences('user-1')).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateUserPreferences', () => {
      it('should update preferences and log audit', async () => {
        mockPrismaService.userPreferences.findUnique.mockResolvedValue({
          userId: 'user-1',
          darkMode: true,
          notifications: {},
          contentPreferences: {},
        });
        mockPrismaService.userPreferences.update.mockResolvedValue({
          userId: 'user-1',
          darkMode: false,
          notifications: {},
          contentPreferences: {},
        });
        mockPrismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

        const result = await service.updateUserPreferences(
          'user-1',
          { darkMode: false },
          'admin-1',
          'super_admin'
        );

        expect(result.darkMode).toBe(false);
        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });
  });

  describe('User Stats', () => {
    describe('getUserStats', () => {
      it('should return aggregated stats', async () => {
        mockPrismaService.subscription.count.mockResolvedValueOnce(100);
        mockPrismaService.subscription.count.mockResolvedValueOnce(50);
        mockPrismaService.watchHistory.count.mockResolvedValue(500);
        mockPrismaService.savedItem.count.mockResolvedValue(200);
        mockPrismaService.subscription.findMany.mockResolvedValue([]);

        const result = await service.getUserStats();

        expect(result.totalSubscriptions).toBe(100);
        expect(result.activeSubscriptions).toBe(50);
        expect(result.totalWatchHistory).toBe(500);
        expect(result.totalSavedItems).toBe(200);
      });
    });
  });
});
