import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

// ============================================================================
// Immutable Audit Log (TAA §56)
//
// Production mode: Uses PostgreSQL via PrismaClient for persistent storage
// Test mode: Falls back to in-memory array when no PrismaClient is provided
// ============================================================================

export interface ImmutableAuditEntry {
  id: string;
  /** Sequential number for chain integrity */
  sequenceNumber: number;
  /** Hash of this entry */
  hash: string;
  /** Hash of the previous entry (chain) */
  previousHash: string;
  /** Actor who performed the action */
  actorId: string;
  /** Actor's role */
  actorRole: string;
  /** Action performed */
  action: string;
  /** Resource type */
  resourceType: string;
  /** Resource ID */
  resourceId: string;
  /** Previous state (for mutations) */
  previousState?: string;
  /** New state (for mutations) */
  newState?: string;
  /** Reason/justification */
  reason?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
  /** Timestamp */
  timestamp: Date;
  /** Status */
  status: 'success' | 'failure' | 'pending_approval';
}

/**
 * Append-only audit log with hash chain for integrity.
 * No edit/delete operations allowed — truly immutable.
 *
 * Uses PostgreSQL when PrismaClient is injected (production),
 * falls back to in-memory array for testing.
 */
@Injectable()
export class ImmutableAuditService {
  private readonly logger = new Logger(ImmutableAuditService.name);
  private prisma: any; // PrismaClient — optional injection

  // In-memory fallback (used when no PrismaClient)
  private static inMemoryLog: ImmutableAuditEntry[] = [];
  private static sequenceCounter = 0;
  private static lastHash = '0'.repeat(64);

  constructor(@Optional() prismaClient?: any) {
    this.prisma = prismaClient;
  }

  /**
   * Set the Prisma client (for dependency injection)
   */
  setPrismaClient(client: any): void {
    this.prisma = client;
  }

  /**
   * Check if running in production mode (PostgreSQL)
   */
  private get isProduction(): boolean {
    return !!this.prisma;
  }

  /**
   * Clear the in-memory store (for testing only)
   */
  static clearStore(): void {
    ImmutableAuditService.inMemoryLog.length = 0;
    ImmutableAuditService.sequenceCounter = 0;
    ImmutableAuditService.lastHash = '0'.repeat(64);
  }

  /**
   * Get the next sequence number
   */
  private async getNextSequence(): Promise<number> {
    if (this.isProduction) {
      const result = await this.prisma.$queryRaw`
        SELECT COALESCE(MAX("sequenceNumber"), 0) + 1 as next_seq FROM audit_log
      `;
      return Number(result[0].next_seq);
    }
    return ++ImmutableAuditService.sequenceCounter;
  }

  /**
   * Get the last hash
   */
  private async getLastHash(): Promise<string> {
    if (this.isProduction) {
      const result = await this.prisma.$queryRaw`
        SELECT hash FROM audit_log ORDER BY "sequenceNumber" DESC LIMIT 1
      `;
      return result.length > 0 ? result[0].hash : '0'.repeat(64);
    }
    return ImmutableAuditService.lastHash;
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

    if (this.isProduction) {
      // Persist to PostgreSQL
      await this.prisma.auditLog.create({
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
      ImmutableAuditService.lastHash = newEntry.hash;
    } else {
      // In-memory fallback
      ImmutableAuditService.lastHash = newEntry.hash;
      ImmutableAuditService.inMemoryLog.push(newEntry);
    }

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
    if (this.isProduction) {
      const where: any = {};

      if (filters?.actorId) where.actorId = filters.actorId;
      if (filters?.action) where.action = filters.action;
      if (filters?.resourceType) where.resourceType = filters.resourceType;
      if (filters?.resourceId) where.resourceId = filters.resourceId;
      if (filters?.since || filters?.until) {
        where.timestamp = {};
        if (filters.since) where.timestamp.gte = filters.since;
        if (filters.until) where.timestamp.lte = filters.until;
      }

      const rows = await this.prisma.auditLog.findMany({
        where,
        orderBy: { sequenceNumber: 'asc' },
        take: filters?.limit,
      });

      return rows.map(this.mapRowToEntry);
    }

    // In-memory fallback
    let results = [...ImmutableAuditService.inMemoryLog];

    if (filters) {
      if (filters.actorId) {
        results = results.filter((e) => e.actorId === filters.actorId);
      }
      if (filters.action) {
        results = results.filter((e) => e.action === filters.action);
      }
      if (filters.resourceType) {
        results = results.filter((e) => e.resourceType === filters.resourceType);
      }
      if (filters.resourceId) {
        results = results.filter((e) => e.resourceId === filters.resourceId);
      }
      if (filters.since) {
        results = results.filter((e) => e.timestamp >= filters.since!);
      }
      if (filters.until) {
        results = results.filter((e) => e.timestamp <= filters.until!);
      }
    }

    results.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    if (filters?.limit) {
      results = results.slice(-filters.limit);
    }

    return results;
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

    if (this.isProduction) {
      const allEntries = await this.prisma.auditLog.findMany({
        orderBy: { sequenceNumber: 'asc' },
      });

      for (let i = 0; i < allEntries.length; i++) {
        const entry = allEntries[i];

        if (entry.sequenceNumber !== i + 1) {
          errors.push(
            `Sequence gap at index ${i}: expected ${i + 1}, got ${entry.sequenceNumber}`
          );
        }

        if (entry.previousHash !== previousHash) {
          errors.push(
            `Hash chain broken at entry ${entry.sequenceNumber}: expected ${previousHash}, got ${entry.previousHash}`
          );
        }

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

    // In-memory fallback
    const log = ImmutableAuditService.inMemoryLog;

    for (let i = 0; i < log.length; i++) {
      const entry = log[i];

      if (entry.sequenceNumber !== i + 1) {
        errors.push(
          `Sequence gap at index ${i}: expected ${i + 1}, got ${entry.sequenceNumber}`
        );
      }

      if (entry.previousHash !== previousHash) {
        errors.push(
          `Hash chain broken at entry ${entry.sequenceNumber}: expected ${previousHash}, got ${entry.previousHash}`
        );
      }

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
      totalEntries: log.length,
      errors,
    };
  }

  /**
   * Get the last entry in the chain
   */
  async getLastEntry(): Promise<ImmutableAuditEntry | undefined> {
    if (this.isProduction) {
      const row = await this.prisma.auditLog.findFirst({
        orderBy: { sequenceNumber: 'desc' },
      });
      return row ? this.mapRowToEntry(row) : undefined;
    }
    return ImmutableAuditService.inMemoryLog[ImmutableAuditService.inMemoryLog.length - 1];
  }

  /**
   * Get total entry count
   */
  async getEntryCount(): Promise<number> {
    if (this.isProduction) {
      return this.prisma.auditLog.count();
    }
    return ImmutableAuditService.inMemoryLog.length;
  }

  /**
   * Map database row to entry interface
   */
  private mapRowToEntry(row: any): ImmutableAuditEntry {
    return {
      id: row.id,
      sequenceNumber: row.sequenceNumber,
      hash: row.hash,
      previousHash: row.previousHash,
      actorId: row.actorId,
      actorRole: row.actorRole,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      previousState: row.previousState ?? undefined,
      newState: row.newState ?? undefined,
      reason: row.reason ?? undefined,
      correlationId: row.correlationId ?? undefined,
      ipAddress: row.ipAddress ?? undefined,
      userAgent: row.userAgent ?? undefined,
      timestamp: row.timestamp,
      status: row.status,
    };
  }
}
