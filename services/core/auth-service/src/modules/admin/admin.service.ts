import {Inject,  Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AuthRepository } from '../auth/auth.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async getStats() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [totalUsers, activeUsersToday, signupsToday] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.session.count({
          where: { lastActiveAt: { gte: todayStart } },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: todayStart } },
        }),
      ]);

      return ApiResponseWrapper.success({ totalUsers, activeUsersToday, signupsToday });
    } catch (error) {
      this.logger.error(`Failed to get auth stats: ${error}`);
      return {
        success: false,
        error: { code: 'GET_STATS_FAILED', message: 'Failed to retrieve auth stats' },
      };
    }
  }

  async getUsers(options?: { page?: number; limit?: number; role?: string; status?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.role) where.role = options.role;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return ApiResponseWrapper.paginated(users, page, limit, total);
    } catch (error) {
      this.logger.error(`Failed to get users: ${error}`);
      return {
        success: false,
        error: { code: 'GET_USERS_FAILED', message: 'Failed to retrieve users' },
      };
    }
  }

  async getUserById(id: string) {
    try {
      const user = await this.authRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return ApiResponseWrapper.success(user);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get user by id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_USER_FAILED', message: 'Failed to retrieve user' },
      };
    }
  }

  async suspendUser(id: string) {
    try {
      const user = await this.authRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const updated = await this.authRepository.update(id, { role: 'suspended' } as never);
      return ApiResponseWrapper.success(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to suspend user: ${error}`);
      return {
        success: false,
        error: { code: 'SUSPEND_USER_FAILED', message: 'Failed to suspend user' },
      };
    }
  }

  async activateUser(id: string) {
    try {
      const user = await this.authRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const updated = await this.authRepository.update(id, { role: 'user' } as never);
      return ApiResponseWrapper.success(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to activate user: ${error}`);
      return {
        success: false,
        error: { code: 'ACTIVATE_USER_FAILED', message: 'Failed to activate user' },
      };
    }
  }
}
