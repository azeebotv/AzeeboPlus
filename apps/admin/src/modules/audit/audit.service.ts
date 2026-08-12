import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogEntry {
  actorId?: string;
  actorType?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface LogFilters {
  actorId?: string;
  action?: string;
  /** Single targetType, or a list (e.g. ['content', 'category', 'tag']) for group filters. */
  targetType?: string | string[];
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface PaginatedResult {
  logs: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditLogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        actorType: entry.actorType || 'user',
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details as object,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  async getLogs(filters?: LogFilters, page = 1, limit = 50): Promise<PaginatedResult> {
    const where: Record<string, unknown> = {};

    if (filters?.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.targetType) {
      const types = Array.isArray(filters.targetType)
        ? filters.targetType
        : [filters.targetType];
      where.targetType = types.length === 1 ? types[0] : { in: types };
    }

    if (filters?.targetId) {
      where.targetId = filters.targetId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) {
        (where.createdAt as Record<string, unknown>).gte = filters.startDate;
      }
      if (filters?.endDate) {
        (where.createdAt as Record<string, unknown>).lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLogsForTarget(
    targetType: string,
    targetId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResult> {
    return this.getLogs({ targetType, targetId }, page, limit);
  }

  async getLogsByActor(actorId: string, page = 1, limit = 20): Promise<PaginatedResult> {
    return this.getLogs({ actorId }, page, limit);
  }
}
