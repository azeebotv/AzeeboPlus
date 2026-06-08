import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthRepository } from '../auth/auth.repository';
import { PrismaService } from '../database/prisma.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Injectable()
export class AdminService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getStats() {
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
  }

  async getUsers(options?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  }) {
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
  }

  async getUserById(id: string) {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return ApiResponseWrapper.success(user);
  }

  async suspendUser(id: string) {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.authRepository.update(id, { role: 'suspended' } as never);
    return ApiResponseWrapper.success(updated);
  }

  async activateUser(id: string) {
    const user = await this.authRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.authRepository.update(id, { role: 'user' } as never);
    return ApiResponseWrapper.success(updated);
  }
}
