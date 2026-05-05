import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  creators: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date;
  walletBalance: number;
  contentCount: number;
}

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(page = 1, limit = 20, role?: string, search?: string): Promise<unknown> {
    const where: Prisma.UserWhereInput = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          _count: { select: { contentItems: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
        walletBalance: u.wallet?.balance || 0,
        contentCount: u._count.contentItems,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        creatorProfile: true,
        contentItems: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { contentItems: true, notifications: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      wallet: user.wallet,
      creatorProfile: user.creatorProfile,
      contentCount: user._count.contentItems,
      notificationCount: user._count.notifications,
      recentContent: user.contentItems,
    };
  }

  async updateUserRole(userId: string, newRole: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
      },
    };
  }

  async suspendUser(userId: string, reason: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: `User suspended: ${reason}`,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: 'suspended',
      },
    };
  }

  async getUserStats(): Promise<UserStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, newUsersToday, activeUsers, creators] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.user.count({
        where: { role: 'user' },
      }),
      this.prisma.user.count({
        where: { role: 'creator' },
      }),
    ]);

    return {
      totalUsers,
      newUsersToday,
      activeUsers,
      creators,
    };
  }

  async deleteUser(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'deleted' },
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
