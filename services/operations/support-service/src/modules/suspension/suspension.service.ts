import {Inject,  Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { ServiceClient } from '@azeebo/http-client';

@Injectable()
export class SuspensionService {
  private readonly logger = new Logger(SuspensionService.name);
  private readonly notificationServiceClient: ServiceClient;
  private readonly auditServiceClient: ServiceClient;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('INTERNAL_API_KEY', '');
    this.notificationServiceClient = new ServiceClient({
      baseURL: this.configService.getOrThrow<string>('NOTIFICATION_SERVICE_URL'),
      timeout: 30000,
      apiKey,
    });
    this.auditServiceClient = new ServiceClient({
      baseURL: this.configService.getOrThrow<string>('MODERATION_SERVICE_URL'),
      timeout: 30000,
      apiKey,
    });
  }

  async suspendUser(data: {
    ticketId: string;
    userId: string;
    reason: string;
    suspendedBy: string;
    durationDays?: number;
  }) {
    return this.createSuspension(data);
  }

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

    const suspension = await this.prisma.userSuspension.create({
      data: {
        ticketId: data.ticketId,
        userId: data.userId,
        reason: data.reason,
        suspendedBy: data.suspendedBy,
        expiresAt,
      },
    });

    await Promise.all([
      this.sendSuspensionNotification(data.userId, suspension),
      this.createAuditEvent({
        action: 'user_suspended',
        resourceType: 'user_suspension',
        resourceId: suspension.id,
        actorType: 'admin',
        actorId: data.suspendedBy,
        previousState: { status: 'ACTIVE' },
        newState: { status: 'SUSPENDED', reason: data.reason, expiresAt },
        metadata: { userId: data.userId, ticketId: data.ticketId, durationDays: data.durationDays },
      }),
    ]);

    return suspension;
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
    const suspension = await this.prisma.userSuspension.findUnique({ where: { id } });
    if (!suspension) {
      throw new NotFoundException('Suspension not found');
    }

    const updatedSuspension = await this.prisma.userSuspension.update({
      where: { id },
      data: {
        status: 'REINSTATED',
        reinstatedAt: new Date(),
        reinstatedBy,
      },
    });

    await Promise.all([
      this.sendReinstatementNotification(suspension.userId, updatedSuspension),
      this.createAuditEvent({
        action: 'user_reinstated',
        resourceType: 'user_suspension',
        resourceId: id,
        actorType: 'admin',
        actorId: reinstatedBy,
        previousState: { status: suspension.status },
        newState: { status: 'REINSTATED' },
        metadata: { userId: suspension.userId },
      }),
    ]);

    return updatedSuspension;
  }

  async liftSuspension(id: string, reinstatedBy: string) {
    const suspension = await this.prisma.userSuspension.findUnique({ where: { id } });
    if (!suspension) {
      throw new NotFoundException('Suspension not found');
    }

    const updatedSuspension = await this.prisma.userSuspension.update({
      where: { id },
      data: {
        status: 'LIFTED',
        reinstatedAt: new Date(),
        reinstatedBy,
      },
    });

    await Promise.all([
      this.sendReinstatementNotification(suspension.userId, updatedSuspension),
      this.createAuditEvent({
        action: 'suspension_lifted',
        resourceType: 'user_suspension',
        resourceId: id,
        actorType: 'admin',
        actorId: reinstatedBy,
        previousState: { status: suspension.status },
        newState: { status: 'LIFTED' },
        metadata: { userId: suspension.userId },
      }),
    ]);

    return updatedSuspension;
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

      await Promise.all([
        this.sendReinstatementNotification(suspension.userId, { ...suspension, status: 'EXPIRED' }),
        this.createAuditEvent({
          action: 'suspension_expired',
          resourceType: 'user_suspension',
          resourceId: suspension.id,
          actorType: 'system',
          previousState: { status: 'ACTIVE' },
          newState: { status: 'EXPIRED' },
          metadata: { userId: suspension.userId },
        }),
      ]);
    }

    return expired.length;
  }

  private async sendSuspensionNotification(
    userId: string,
    suspension: { id: string; reason: string; expiresAt?: Date | null }
  ) {
    try {
      await this.notificationServiceClient.post('/api/notifications', {
        userId,
        type: 'SUSPENSION',
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${suspension.reason}. ${suspension.expiresAt ? `This suspension expires on ${suspension.expiresAt.toLocaleDateString()}.` : 'This is a permanent suspension.'}`,
        metadata: { suspensionId: suspension.id },
        priority: 'high',
      });
    } catch (error) {
      this.logger.error(`Failed to send suspension notification: ${(error as Error).message}`);
    }
  }

  private async sendReinstatementNotification(
    userId: string,
    suspension: { id: string; status: string }
  ) {
    try {
      const message =
        suspension.status === 'EXPIRED'
          ? 'Your account suspension has expired. Your account has been reinstated.'
          : 'Your account suspension has been lifted by an administrator.';

      await this.notificationServiceClient.post('/api/notifications', {
        userId,
        type: 'SUSPENSION_REINSTATED',
        title: 'Account Reinstated',
        message,
        metadata: { suspensionId: suspension.id, status: suspension.status },
        priority: 'high',
      });
    } catch (error) {
      this.logger.error(`Failed to send reinstatement notification: ${(error as Error).message}`);
    }
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
      await this.auditServiceClient.post('/api/moderation/audit', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to create audit event: ${(error as Error).message}`);
    }
  }
}
