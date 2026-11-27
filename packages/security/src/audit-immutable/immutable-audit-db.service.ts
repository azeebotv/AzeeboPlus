import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { pseudonymizeIdentifier } from '../log-redaction';
import type { AuditPrismaClient } from '../types';

// ============================================================================
// Immutable Audit Log — Database-Backed Implementation (TAA §56)
// ============================================================================

export interface ImmutableAuditEntry {
  id: string;
  sequenceNumber: number;
  hash: string;
  previousHash: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'failure' | 'pending_approval';
}

/**
 * Database-backed immutable audit service.
 * Uses PostgreSQL for persistent, append-only audit log with hash chain integrity.
 *
 * In integration tests, this connects to a real PostgreSQL instance via Prisma.
 * In production, this provides true persistence across service restarts.
 */
@Injectable()
export class ImmutableAuditDbService {
  private readonly logger = new Logger(ImmutableAuditDbService.name);
  private prisma: AuditPrismaClient | undefined;

  constructor(prismaClient?: AuditPrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Set the Prisma client (for dependency injection)
   */
  setPrismaClient(client: AuditPrismaClient): void {
    this.prisma = client;
  }

  /**
   * Get the next sequence number (from database)
   */
  private async getNextSequence(): Promise<number> {
    const result = (await this.prisma!.$queryRaw`
      SELECT COALESCE(MAX("sequenceNumber"), 0) + 1 as next_seq FROM audit_log
    `) as { next_seq: bigint }[];
    return Number(result[0].next_seq);
  }

  /**
   * Get the last hash (from database)
   */
  private async getLastHash(): Promise<string> {
    const result = (await this.prisma!.$queryRaw`
      SELECT hash FROM audit_log ORDER BY "sequenceNumber" DESC LIMIT 1
    `) as { hash: string }[];
    return result.length > 0 ? result[0].hash : '0'.repeat(64);
  }

  /**
   * Write an audit entry (append-only, never modify or delete)
   */
  async writeEntry(entry: {
    actorId: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string;
    previousState?: string;
    newState?: string;
    reason?: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure' | 'pending_approval';
  }): Promise<ImmutableAuditEntry> {
    const sequenceNumber = await this.getNextSequence();
    const previousHash = await this.getLastHash();
    const now = new Date();

    const newEntry: ImmutableAuditEntry = {
      id: randomUUID(),
      sequenceNumber,
      hash: '',
      previousHash,
      ...entry,
      timestamp: now,
    };

    // Compute hash (SHA-256 of entry content + previous hash)
    const contentToHash = JSON.stringify({
      sequenceNumber: newEntry.sequenceNumber,
      actorId: newEntry.actorId,
      action: newEntry.action,
      resourceType: newEntry.resourceType,
      resourceId: newEntry.resourceId,
      timestamp: newEntry.timestamp.toISOString(),
      previousHash: newEntry.previousHash,
    });
    newEntry.hash = createHash('sha256').update(contentToHash).digest('hex');

    // Persist to database (append-only)
    await this.prisma!.auditLog.create({
      data: {
        id: newEntry.id,
        sequenceNumber: newEntry.sequenceNumber,
        hash: newEntry.hash,
        previousHash: newEntry.previousHash,
        actorId: newEntry.actorId,
        actorRole: newEntry.actorRole,
        action: newEntry.action,
        resourceType: newEntry.resourceType,
        resourceId: newEntry.resourceId,
        previousState: newEntry.previousState,
        newState: newEntry.newState,
        reason: newEntry.reason,
        correlationId: newEntry.correlationId,
        ipAddress: newEntry.ipAddress,
        userAgent: newEntry.userAgent,
        timestamp: newEntry.timestamp,
        status: newEntry.status,
      },
    });

    this.logger.log(
      `AUDIT: [${newEntry.sequenceNumber}] ${newEntry.action} on ${newEntry.resourceType}/${newEntry.resourceId} by ${newEntry.actorId} (${newEntry.actorRole})`
    );

    return newEntry;
  }

  /**
   * Read audit entries (no write, no modify, no delete)
   */
  async getEntries(filters?: {
    actorId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    since?: Date;
    until?: Date;
    limit?: number;
  }): Promise<ImmutableAuditEntry[]> {
    const where: Record<string, unknown> & { timestamp?: { gte?: Date; lte?: Date } } =
      {} as Record<string, unknown> & { timestamp?: { gte?: Date; lte?: Date } };

    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.since || filters?.until) {
      where.timestamp = {};
      if (filters.since) where.timestamp!.gte = filters.since;
      if (filters.until) where.timestamp!.lte = filters.until;
    }

    const rows = await this.prisma!.auditLog.findMany({
      where,
      orderBy: { sequenceNumber: 'asc' },
      take: filters?.limit,
    });

    return rows.map(this.mapRowToEntry);
  }

  /**
   * Verify the integrity of the audit chain
   */
  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let previousHash = '0'.repeat(64);

    const allEntries = await this.prisma!.auditLog.findMany({
      orderBy: { sequenceNumber: 'asc' },
    });

    for (let i = 0; i < allEntries.length; i++) {
      const e = allEntries[i];
      const entry = {
        sequenceNumber: Number(e.sequenceNumber),
        previousHash: e.previousHash as string,
        timestamp: e.timestamp as Date,
        actorId: e.actorId as string,
        action: e.action as string,
        resourceType: e.resourceType as string,
        resourceId: e.resourceId as string,
        hash: e.hash as string,
      };

      // Check sequence continuity
      if (entry.sequenceNumber !== i + 1) {
        errors.push(`Sequence gap at index ${i}: expected ${i + 1}, got ${entry.sequenceNumber}`);
      }

      // Check previous hash chain
      if (entry.previousHash !== previousHash) {
        errors.push(
          `Hash chain broken at entry ${entry.sequenceNumber}: expected ${previousHash}, got ${entry.previousHash}`
        );
      }

      // Verify hash
      const contentToHash = JSON.stringify({
        sequenceNumber: entry.sequenceNumber,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        timestamp: entry.timestamp.toISOString(),
        previousHash: entry.previousHash,
      });
      const expectedHash = createHash('sha256').update(contentToHash).digest('hex');
      if (entry.hash !== expectedHash) {
        errors.push(
          `Hash mismatch at entry ${entry.sequenceNumber}: expected ${expectedHash}, got ${entry.hash}`
        );
      }

      previousHash = entry.hash;
    }

    return {
      valid: errors.length === 0,
      totalEntries: allEntries.length,
      errors,
    };
  }

  /**
   * Get the last entry in the chain
   */
  async getLastEntry(): Promise<ImmutableAuditEntry | undefined> {
    const row = await this.prisma!.auditLog.findFirst({
      orderBy: { sequenceNumber: 'desc' },
    });
    return row ? this.mapRowToEntry(row) : undefined;
  }

  /**
   * Get total entry count
   */
  async getEntryCount(): Promise<number> {
    return this.prisma!.auditLog.count();
  }

  /**
   * AUD-48: pseudonymize network metadata (IP + user agent) on entries older
   * than the cutoff (e.g. a 180-day retention window enforced by a job).
   *
   * Legal basis: Art. 6(1)(f) GDPR — network metadata supports security
   * monitoring, incident response and fraud investigation, so audit rows are
   * exempt from right-to-erasure row deletion (unlike the user-service
   * application audit log, which erases wholesale). Minimization is by
   * pseudonymization: after the window elapses, identifying values are
   * replaced with keyed hashes.
   *
   * Chain integrity is preserved by construction: the chain hash covers only
   * sequenceNumber, actorId, action, resourceType, resourceId, timestamp and
   * previousHash — ipAddress/userAgent are deliberately excluded from
   * contentToHash, so this sweep can never invalidate verifyIntegrity().
   */
  async pseudonymizeNetworkMetadata(olderThan: Date): Promise<{ compacted: number }> {
    const stale = (await this.prisma!.auditLog.groupBy({
      by: ['ipAddress', 'userAgent'],
      where: {
        timestamp: { lt: olderThan },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
    })) as { ipAddress: string | null; userAgent: string | null }[];

    let compacted = 0;
    for (const pair of stale) {
      const result = await this.prisma!.auditLog.updateMany({
        where: {
          timestamp: { lt: olderThan },
          ipAddress: pair.ipAddress,
          userAgent: pair.userAgent,
        },
        data: {
          ipAddress: pair.ipAddress ? pseudonymizeIdentifier(pair.ipAddress) : null,
          userAgent: pair.userAgent ? pseudonymizeIdentifier(pair.userAgent) : null,
        },
      });
      compacted += result.count;
    }
    return { compacted };
  }

  /**
   * Map database row to entry interface
   */
  private mapRowToEntry(row: Record<string, unknown>): ImmutableAuditEntry {
    return {
      id: row.id as string,
      sequenceNumber: Number(row.sequenceNumber),
      hash: row.hash as string,
      previousHash: row.previousHash as string,
      actorId: row.actorId as string,
      actorRole: row.actorRole as string,
      action: row.action as string,
      resourceType: row.resourceType as string,
      resourceId: row.resourceId as string,
      previousState: (row.previousState as string) ?? undefined,
      newState: (row.newState as string) ?? undefined,
      reason: (row.reason as string) ?? undefined,
      correlationId: (row.correlationId as string) ?? undefined,
      ipAddress: (row.ipAddress as string) ?? undefined,
      userAgent: (row.userAgent as string) ?? undefined,
      timestamp: row.timestamp as Date,
      status: row.status as ImmutableAuditEntry['status'],
    };
  }
}
