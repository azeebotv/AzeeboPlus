import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { createApiClient } from '@azeebo/api-client';

@Injectable()
export class AppealService {
  private readonly logger = new Logger(AppealService.name);
  private readonly contentServiceClient;
  private readonly moderationServiceClient;
  private readonly userServiceClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.contentServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('CONTENT_SERVICE_URL'),
      timeout: 30000,
    });
    this.moderationServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('MODERATION_SERVICE_URL'),
      timeout: 30000,
    });
    this.userServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('USER_SERVICE_URL'),
      timeout: 30000,
    });
  }

  async submitAppeal(data: {
    ticketId: string;
    userId: string;
    appealType: string;
    resourceId: string;
    resourceType: string;
    originalDecision: string;
    reason: string;
    evidence?: Record<string, unknown>;
  }) {
    return this.createAppeal(data);
  }

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
    const appeal = await this.prisma.appeal.findUnique({
      where: { id },
    });

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    if (decision === 'APPROVED') {
      if (appeal.resourceType === 'CONTENT') {
        try {
          await this.contentServiceClient.post(`/api/content/${appeal.resourceId}/restore`, {
            restoredBy: decidedBy,
          });
          this.logger.log(`Content ${appeal.resourceId} restored via content-service`);
        } catch (error) {
          this.logger.error(
            `Failed to restore content ${appeal.resourceId}: ${(error as Error).message}`
          );
        }
      } else if (appeal.resourceType === 'USER') {
        try {
          await this.userServiceClient.post(`/api/users/${appeal.resourceId}/unsuspend`, {
            unsuspendedBy: decidedBy,
          });
          this.logger.log(`User ${appeal.resourceId} unsuspended via user-service`);
        } catch (error) {
          this.logger.error(
            `Failed to unsuspend user ${appeal.resourceId}: ${(error as Error).message}`
          );
        }
      }

      try {
        await this.moderationServiceClient.post(
          `/api/moderation/trust-score/${appeal.userId}/adjust`,
          {
            adjustment: 10,
            reason: 'Appeal approved',
          }
        );
        this.logger.log(`Trust score adjusted for user ${appeal.userId}`);
      } catch (error) {
        this.logger.error(`Failed to adjust trust score: ${(error as Error).message}`);
      }
    }

    const updatedAppeal = await this.prisma.appeal.update({
      where: { id },
      data: {
        status: decision,
        decision: notes,
        decidedAt: new Date(),
        decidedBy,
      },
    });

    await this.createAuditEvent({
      action: 'appeal_decision',
      resourceType: 'appeal',
      resourceId: id,
      actorType: 'admin',
      actorId: decidedBy,
      previousState: { status: 'PENDING' },
      newState: { status: decision, decision: notes },
      metadata: {
        resourceId: appeal.resourceId,
        resourceType: appeal.resourceType,
        userId: appeal.userId,
      },
    });

    return updatedAppeal;
  }

  private async createAuditEvent(event: {
    action: string;
    resourceType: string;
    resourceId: string;
    actorType: string;
    actorId?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.moderationServiceClient.post('/api/moderation/audit', event);
    } catch (error) {
      this.logger.error(`Failed to create audit event: ${(error as Error).message}`);
    }
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
