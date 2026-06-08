import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  id: string;
  actorId: string;
  actorType: 'user' | 'system' | 'admin';
  action: string;
  resourceType: string;
  resourceId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(auditData: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: auditData.actorId,
          actorType: auditData.actorType,
          action: auditData.action,
          resourceType: auditData.resourceType,
          resourceId: auditData.resourceId,
          previousValue: auditData.previousValue,
          newValue: auditData.newValue,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          status: auditData.status,
          errorMessage: auditData.errorMessage,
          metadata: auditData.metadata ? JSON.stringify(auditData.metadata) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to write audit log:', error);
    }
  }

  async logRefund(userId: string, transactionId: string, amount: number, status: 'success' | 'failure', errorMessage?: string): Promise<void> {
    await this.log({
      actorId: userId,
      actorType: 'user',
      action: 'refund_processed',
      resourceType: 'transaction',
      resourceId: transactionId,
      metadata: { amount, errorMessage },
      status,
      errorMessage,
    });
  }

  async logUserBan(adminId: string, userId: string, reason: string): Promise<void> {
    await this.log({
      actorId: adminId,
      actorType: 'admin',
      action: 'user_banned',
      resourceType: 'user',
      resourceId: userId,
      metadata: { reason },
      status: 'success',
    });
  }

  async logUserSuspension(adminId: string, userId: string, reason: string, duration?: string): Promise<void> {
    await this.log({
      actorId: adminId,
      actorType: 'admin',
      action: 'user_suspended',
      resourceType: 'user',
      resourceId: userId,
      metadata: { reason, duration },
      status: 'success',
    });
  }

  async logRoleChange(adminId: string, userId: string, oldRole: string, newRole: string): Promise<void> {
    await this.log({
      actorId: adminId,
      actorType: 'admin',
      action: 'role_changed',
      resourceType: 'user',
      resourceId: userId,
      previousValue: oldRole,
      newValue: newRole,
      status: 'success',
    });
  }

  async logLargeTransaction(userId: string, transactionId: string, amount: number, type: 'credit' | 'debit'): Promise<void> {
    await this.log({
      actorId: userId,
      actorType: 'user',
      action: `large_transaction_${type}`,
      resourceType: 'transaction',
      resourceId: transactionId,
      metadata: { amount, type },
      status: 'success',
    });
  }

  async logAdminOverride(adminId: string, action: string, resourceType: string, resourceId: string): Promise<void> {
    await this.log({
      actorId: adminId,
      actorType: 'admin',
      action: `admin_override_${action}`,
      resourceType,
      resourceId,
      status: 'success',
    });
  }

  async getAuditLogsByActor(actorId: string, limit = 100): Promise<AuditEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(this.mapToAuditEntry);
  }

  async getAuditLogsByResource(resourceType: string, resourceId: string, limit = 100): Promise<AuditEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(this.mapToAuditEntry);
  }

  async getAuditLogsByAction(action: string, limit = 100): Promise<AuditEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(this.mapToAuditEntry);
  }

  private mapToAuditEntry(log: {
    id: string;
    actorId: string;
    actorType: string;
    action: string;
    resourceType: string;
    resourceId: string;
    previousValue: string | null;
    newValue: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    status: string;
    errorMessage: string | null;
    metadata: unknown;
  }): AuditEntry {
    return {
      id: log.id,
      actorId: log.actorId,
      actorType: log.actorType as 'user' | 'system' | 'admin',
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      previousValue: log.previousValue ?? undefined,
      newValue: log.newValue ?? undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      timestamp: log.createdAt,
      status: log.status as 'success' | 'failure',
      errorMessage: log.errorMessage ?? undefined,
      metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : (log.metadata as Record<string, unknown> | undefined),
    };
  }
}