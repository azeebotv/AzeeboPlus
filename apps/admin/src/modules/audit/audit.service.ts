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

/** Common shape of admin audit rows and normalized auth-trail rows. */
interface AuditRow {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  source?: string;
}

@Injectable()
export class AuditLogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry, tx?: any): Promise<void> {
    const client = tx || this.prisma;
    await client.auditLog.create({
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
      const types = Array.isArray(filters.targetType) ? filters.targetType : [filters.targetType];
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

    // Centralized audit view: the admin's own audit_logs PLUS auth-service's
    // live login/token trail. azeebo_auth.audit_logs is federated read-only
    // into this database as auth_audit_logs (different schema), normalized to
    // the AuditLog shape by fetchAuthTrail below. The auth trail is small and
    // held in memory; the local (admin) side keeps SQL-level pagination.
    const [localLogs, localTotal, authTrail] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
      this.fetchAuthTrail(filters),
    ]);

    const merged: AuditRow[] = [
      ...authTrail,
      // local rows get the explicit source tag too, so the client's source
      // badge has a defined value for every row (undefined → treated as admin)
      ...localLogs.map((l) => ({ ...l, source: 'admin' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = localTotal + authTrail.length;

    return {
      logs: merged.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Auth-service's own audit trail, read through the auth_audit_logs foreign
   * table and normalized to the AuditLog shape. Skipped (not failed) when the
   * foreign table does not exist — fresh checkouts without federation — and
   * when the page filters by targetType/targetId, which auth-trail rows
   * ('auth'-targeted events) never match.
   */
  private async fetchAuthTrail(filters?: LogFilters): Promise<AuditRow[]> {
    if (filters?.targetType || filters?.targetId) return [];
    try {
      const rows = (await this.prisma.$queryRaw`
        SELECT id, "actor" AS "actorId", action, "resourceId" AS "targetId",
               "ipAddress", "userAgent", "createdAt"
        FROM "auth_audit_logs"
        ORDER BY "createdAt" DESC`) as Array<{
        id: string;
        actorId: string | null;
        action: string;
        targetId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        createdAt: Date;
      }>;
      return rows
        .filter((r) => (filters?.actorId ? r.actorId === filters.actorId : true))
        .filter((r) => (filters?.action ? r.action === filters.action : true))
        .filter((r) => (filters?.startDate ? r.createdAt >= filters.startDate : true))
        .filter((r) => (filters?.endDate ? r.createdAt <= filters.endDate : true))
        .map((r) => ({
          id: r.id,
          actorId: r.actorId,
          actorType: 'user',
          action: r.action,
          targetType: 'auth',
          targetId: r.targetId,
          details: null,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
          createdAt: r.createdAt,
          source: 'auth-service',
        }));
    } catch {
      // auth_audit_logs only exists once federate-admin-db.sh has run
      return [];
    }
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
