import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';

@Injectable()
export class AppealService {
  constructor(private prisma: PrismaService) {}

  async createAppeal(data: {
    ticketId: string;
    userId: string;
    appealType: string;
    resourceId: string;
    resourceType: string;
    originalDecision: string;
    reason: string;
    evidence?: Record<string, unknown>;
  }) {
    const existing = await this.prisma.appeal.findFirst({
      where: {
        resourceId: data.resourceId,
        resourceType: data.resourceType,
        status: { not: 'REJECTED' },
      },
    });

    if (existing) {
      throw new BadRequestException('Appeal already exists for this resource');
    }

    const appeal = await this.prisma.appeal.create({
      data: {
        ticketId: data.ticketId,
        userId: data.userId,
        appealType: data.appealType,
        resourceId: data.resourceId,
        resourceType: data.resourceType,
        originalDecision: data.originalDecision,
        reason: data.reason,
        evidence: data.evidence as Prisma.InputJsonValue,
      },
    });

    return appeal;
  }

  async getAppealById(id: string) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }
    return appeal;
  }

  async decideAppeal(
    id: string,
    decision: 'APPROVED' | 'REJECTED',
    decidedBy: string,
    notes?: string
  ) {
    const appeal = await this.prisma.appeal.update({
      where: { id },
      data: {
        status: decision,
        decision: notes,
        decidedAt: new Date(),
        decidedBy,
      },
    });

    if (decision === 'APPROVED' && appeal.resourceType === 'CONTENT') {
      await this.prisma.contentItem
        .update({
          where: { id: appeal.resourceId },
          data: { status: 'PUBLISHED' },
        })
        .catch(() => {});
    }

    return appeal;
  }

  async getPendingAppeals(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [appeals, total] = await Promise.all([
      this.prisma.appeal.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { ticket: true },
      }),
      this.prisma.appeal.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      appeals,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserAppeals(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [appeals, total] = await Promise.all([
      this.prisma.appeal.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appeal.count({ where: { userId } }),
    ]);

    return {
      appeals,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
