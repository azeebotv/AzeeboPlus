import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';

@Injectable()
export class TakedownService {
  constructor(private prisma: PrismaService) {}

  async createTakedown(data: {
    ticketId: string;
    contentId: string;
    reportedBy: string;
    reason: string;
    evidence?: Record<string, unknown>;
  }) {
    return this.prisma.contentTakedown.create({
      data: {
        ticketId: data.ticketId,
        contentId: data.contentId,
        reportedBy: data.reportedBy,
        reason: data.reason,
        evidence: data.evidence as Prisma.InputJsonValue,
      },
    });
  }

  async getTakedownById(id: string) {
    const takedown = await this.prisma.contentTakedown.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!takedown) {
      throw new NotFoundException('Takedown not found');
    }
    return takedown;
  }

  async decideTakedown(
    id: string,
    decision: 'REMOVED' | 'RESTORED' | 'DISMISSED',
    decidedBy: string,
    notes?: string
  ) {
    const takedown = await this.prisma.contentTakedown.update({
      where: { id },
      data: {
        status: decision,
        decision: notes,
        decidedAt: new Date(),
        decidedBy,
      },
    });

    if (decision === 'REMOVED') {
      await this.prisma.contentItem
        .update({
          where: { id: takedown.contentId },
          data: { status: 'REMOVED' },
        })
        .catch(() => {});
    } else if (decision === 'RESTORED') {
      await this.prisma.contentItem
        .update({
          where: { id: takedown.contentId },
          data: { status: 'PUBLISHED' },
        })
        .catch(() => {});
    }

    return takedown;
  }

  async getPendingTakedowns(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [takedowns, total] = await Promise.all([
      this.prisma.contentTakedown.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { ticket: true },
      }),
      this.prisma.contentTakedown.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      takedowns,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTakedownsByContent(contentId: string) {
    return this.prisma.contentTakedown.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
