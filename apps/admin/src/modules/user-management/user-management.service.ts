import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

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
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

  async getUsers(page = 1, limit = 20, role?: string, search?: string): Promise<unknown> {
    const where: Prisma.UserWhereInput = {};

    if (role && role !== 'all') {
      where.role = role as Prisma.EnumUserRoleFilter<'User'>;
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
          creatorProfile: true,
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
        isActive: !u.isSuspended,
        suspensionStatus: u.isSuspended ? 'suspended' : 'active',
        // Creator verification state (null for non-creators) so the directory
        // can render a correct Verify/Unverify toggle without a detail fetch.
        isVerified: u.creatorProfile?.verified ?? null,
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
      isSuspended: user.isSuspended,
      suspensionReason: user.suspensionReason,
      isVerified: user.creatorProfile?.verified ?? false,
      createdAt: user.createdAt,
      wallet: user.wallet,
      creatorProfile: user.creatorProfile,
      contentCount: user._count.contentItems,
      notificationCount: user._count.notifications,
      recentContent: user.contentItems,
    };
  }

  async updateUserRole(
    userId: string,
    newRole: string,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<unknown> {
    const allowedRoles: UserRole[] = ['user', 'creator', 'moderator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(newRole as UserRole)) {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const oldRole = user.role;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as UserRole },
    });

    await this.auditService.log({
      actorId,
      action: 'update_role',
      targetType: 'user',
      targetId: userId,
      details: { oldRole, newRole },
      ipAddress,
      userAgent,
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

  async suspendUser(
    userId: string,
    reason: string,
    suspendedBy: string,
    durationDays?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : undefined;

    const [updatedUser, suspension] = await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedUntil: expiresAt,
          suspensionReason: reason,
          suspendedBy,
          updatedAt: new Date(),
        },
      }),
      this.prisma.userSuspension.create({
        data: {
          userId,
          reason,
          suspendedBy,
          expiresAt,
        },
      }),
    ]);

    await this.auditService.log({
      actorId: suspendedBy,
      action: 'suspend',
      targetType: 'user',
      targetId: userId,
      details: { reason, durationDays },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: `User suspended: ${reason}`,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        status: 'suspended',
        suspendedAt: updatedUser.suspendedAt,
        suspendedUntil: updatedUser.suspendedUntil,
        suspensionReason: updatedUser.suspensionReason,
        suspendedBy: updatedUser.suspendedBy,
        suspensionId: suspension.id,
      },
    };
  }

  async bulkSuspend(
    userIds: string[],
    reason: string,
    suspendedBy: string,
    durationDays?: number,
    ipAddress?: string
  ): Promise<{ suspended: number; failed: number }> {
    let suspended = 0;
    let failed = 0;

    for (const id of userIds) {
      try {
        await this.suspendUser(id, reason, suspendedBy, durationDays, ipAddress);
        suspended++;
      } catch (err) {
        failed++;
      }
    }

    return { suspended, failed };
  }

  async revokeSuspension(
    userId: string,
    revokedBy: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isSuspended) {
      throw new Error('User is not currently suspended');
    }

    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isSuspended: false,
          suspendedAt: null,
          suspendedUntil: null,
          suspensionReason: null,
          suspendedBy: null,
          updatedAt: new Date(),
        },
      }),
      this.prisma.userSuspension.updateMany({
        where: {
          userId,
          status: 'active',
        },
        data: {
          status: 'revoked',
          revokedAt: new Date(),
          revokedBy,
          revokedReason: reason,
        },
      }),
    ]);

    await this.auditService.log({
      actorId: revokedBy,
      action: 'revoke_suspension',
      targetType: 'user',
      targetId: userId,
      details: { reason },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: `Suspension revoked: ${reason}`,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: 'active',
      },
    };
  }

  async getUserSuspensions(userId: string): Promise<unknown> {
    const suspensions = await this.prisma.userSuspension.findMany({
      where: { userId },
      orderBy: { suspendedAt: 'desc' },
    });

    return {
      success: true,
      data: suspensions,
    };
  }

  /** Verify/unverify a creator (the Creators page's verify buttons). */
  async setCreatorVerified(
    userId: string,
    verified: boolean,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'creator') {
      throw new BadRequestException('User is not a creator');
    }

    // creator_profiles is a postgres_fdw FOREIGN table here — ON CONFLICT
    // (Prisma upsert) is not supported through FDW, so find-then-write.
    const existing = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    const profile = existing
      ? await this.prisma.creatorProfile.update({ where: { userId }, data: { verified } })
      : await this.prisma.creatorProfile.create({ data: { userId, verified } });

    await this.auditService.log({
      actorId,
      action: verified ? 'verify_creator' : 'unverify_creator',
      targetType: 'user',
      targetId: userId,
      details: { email: user.email, displayName: user.displayName },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isVerified: profile.verified,
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

  async deleteUser(
    userId: string,
    actorId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.auditService.log({
      actorId,
      action: 'delete',
      targetType: 'user',
      targetId: userId,
      details: { email: user.email, displayName: user.displayName },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
