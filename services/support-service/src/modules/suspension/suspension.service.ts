import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SuspensionService {
  constructor(private prisma: PrismaService) {}

  async createSuspension(data: {
    ticketId: string;
    userId: string;
    reason: string;
    suspendedBy: string;
    durationDays?: number;
  }) {
    const existing = await this.prisma.userSuspension.findFirst({
      where: { userId: data.userId, status: 'ACTIVE' },
    });

    if (existing) {
      throw new BadRequestException('User is already suspended');
    }

    const expiresAt = data.durationDays
      ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.userSuspension.create({
      data: {
        ticketId: data.ticketId,
        userId: data.userId,
        reason: data.reason,
        suspendedBy: data.suspendedBy,
        expiresAt,
      },
    });
  }

  async getSuspensionById(id: string) {
    const suspension = await this.prisma.userSuspension.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!suspension) {
      throw new NotFoundException('Suspension not found');
    }
    return suspension;
  }

  async getActiveSuspension(userId: string) {
    return this.prisma.userSuspension.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
  }

  async reinstateUser(id: string, reinstatedBy: string) {
    return this.prisma.userSuspension.update({
      where: { id },
      data: {
        status: 'REINSTATED',
        reinstatedAt: new Date(),
        reinstatedBy,
      },
    });
  }

  async liftSuspension(id: string, reinstatedBy: string) {
    return this.prisma.userSuspension.update({
      where: { id },
      data: {
        status: 'LIFTED',
        reinstatedAt: new Date(),
        reinstatedBy,
      },
    });
  }

  async getActiveSuspensions(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [suspensions, total] = await Promise.all([
      this.prisma.userSuspension.findMany({
        where: { status: 'ACTIVE' },
        skip,
        take: limit,
        orderBy: { suspendedAt: 'desc' },
        include: { ticket: true },
      }),
      this.prisma.userSuspension.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      suspensions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserSuspensions(userId: string) {
    return this.prisma.userSuspension.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkAndExpireSuspensions() {
    const now = new Date();
    const expired = await this.prisma.userSuspension.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
    });

    for (const suspension of expired) {
      await this.prisma.userSuspension.update({
        where: { id: suspension.id },
        data: { status: 'EXPIRED' },
      });
    }

    return expired.length;
  }
}
