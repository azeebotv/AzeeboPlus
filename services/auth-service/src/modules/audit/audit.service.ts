import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditLogEntry {
  actor: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  result: 'success' | 'failure';
  error?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actor: entry.actor,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          result: entry.result,
          error: entry.error,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: entry.timestamp,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }

  async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { actor: userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return logs as unknown as AuditLogEntry[];
  }
}
