import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { createApiClient, noopTokenStorage } from '@azeebo/api-client';

@Injectable()
export class TakedownService {
  private readonly logger = new Logger(TakedownService.name);
  private readonly contentServiceClient;
  private readonly auditServiceClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.contentServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('CONTENT_SERVICE_URL'),
      timeout: 30000,
      tokenStorage: noopTokenStorage,
    });
    this.auditServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('MODERATION_SERVICE_URL'),
      timeout: 30000,
      tokenStorage: noopTokenStorage,
    });
  }

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
      try {
        await this.contentServiceClient.delete(`/api/content/${takedown.contentId}`, {
          headers: { 'x-admin-user-id': decidedBy },
        });
        this.logger.log(`Content ${takedown.contentId} removed via content-service`);
      } catch (_err) {
        this.logger.error(
          `Failed to remove content ${takedown.contentId}: ${(error as Error).message}`
        );
      }
    } else if (decision === 'RESTORED') {
      try {
        await this.contentServiceClient.post(`/api/content/${takedown.contentId}/restore`, {
          restoredBy: decidedBy,
        });
        this.logger.log(`Content ${takedown.contentId} restored via content-service`);
      } catch (_err) {
        this.logger.error(
          `Failed to restore content ${takedown.contentId}: ${(error as Error).message}`
        );
      }
    }

    await this.createAuditEvent({
      action: 'takedown_decision',
      resourceType: 'content_takedown',
      resourceId: id,
      actorType: 'admin',
      actorId: decidedBy,
      previousState: { status: 'PENDING' },
      newState: { status: decision, decision: notes },
    });

    return takedown;
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
      await this.auditServiceClient.post('/api/moderation/audit', event);
    } catch (_err) {
      this.logger.error(`Failed to create audit event: ${(error as Error).message}`);
    }
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
