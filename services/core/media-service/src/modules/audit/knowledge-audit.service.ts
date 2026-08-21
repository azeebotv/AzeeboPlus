import { Injectable } from '@nestjs/common';

/**
 * Knowledge Grant Auditability Service (TAA §19, §77)
 *
 * Provides audit trail for knowledge graph operations:
 * - When/how knowledge was granted
 * - Who granted it (system/user)
 * - Why it was granted (checkpoint/content)
 * - Historical preservation
 * - Correction impact analysis
 */

export interface KnowledgeAuditEntry {
  /** Unique audit entry ID */
  id: string;
  /** User whose knowledge changed */
  userId: string;
  /** Knowledge unit ID */
  knowledgeUnitId: string;
  /** Action performed */
  action: 'granted' | 'revoked' | 'corrected' | 'projected';
  /** How knowledge was granted */
  grantMethod: 'checkpoint' | 'equivalence' | 'manual' | 'correction';
  /** Checkpoint ID (if granted via checkpoint) */
  checkpointId?: string;
  /** Content ID that triggered the grant */
  contentId?: string;
  /** Canon version at time of grant */
  canonVersion?: string;
  /** Knowledge mapping version */
  mappingVersion?: string;
  /** Operator (user or 'system') */
  operator: string;
  /** Reason for the action */
  reason?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
  /** Previous state (for corrections) */
  previousState?: string;
  /** New state (for corrections) */
  newState?: string;
}

export interface AuditQuery {
  /** Filter by user ID */
  userId?: string;
  /** Filter by knowledge unit ID */
  knowledgeUnitId?: string;
  /** Filter by action */
  action?: KnowledgeAuditEntry['action'];
  /** Filter by content ID */
  contentId?: string;
  /** Filter by date range */
  startDate?: Date;
  /** Filter by date range */
  endDate?: Date;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

@Injectable()
export class KnowledgeAuditService {
  /** In-memory audit log (would be append-only database in production) */
  private readonly auditLog: KnowledgeAuditEntry[] = [];

  /**
   * Record a knowledge audit entry
   */
  async recordEntry(
    entry: Omit<KnowledgeAuditEntry, 'id' | 'timestamp'>
  ): Promise<KnowledgeAuditEntry> {
    const auditEntry: KnowledgeAuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
    };

    this.auditLog.push(auditEntry);

    return auditEntry;
  }

  /**
   * Record knowledge grant
   */
  async recordGrant(
    userId: string,
    knowledgeUnitId: string,
    grantMethod: KnowledgeAuditEntry['grantMethod'],
    options: {
      checkpointId?: string;
      contentId?: string;
      canonVersion?: string;
      mappingVersion?: string;
      operator?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<KnowledgeAuditEntry> {
    return this.recordEntry({
      userId,
      knowledgeUnitId,
      action: 'granted',
      grantMethod,
      checkpointId: options.checkpointId,
      contentId: options.contentId,
      canonVersion: options.canonVersion,
      mappingVersion: options.mappingVersion,
      operator: options.operator || 'system',
      reason: options.reason,
      metadata: options.metadata,
    });
  }

  /**
   * Record knowledge revocation
   */
  async recordRevocation(
    userId: string,
    knowledgeUnitId: string,
    reason: string,
    operator: string = 'system'
  ): Promise<KnowledgeAuditEntry> {
    return this.recordEntry({
      userId,
      knowledgeUnitId,
      action: 'revoked',
      grantMethod: 'manual',
      operator,
      reason,
    });
  }

  /**
   * Record knowledge correction
   */
  async recordCorrection(
    userId: string,
    knowledgeUnitId: string,
    previousState: string,
    newState: string,
    reason: string,
    operator: string = 'admin'
  ): Promise<KnowledgeAuditEntry> {
    return this.recordEntry({
      userId,
      knowledgeUnitId,
      action: 'corrected',
      grantMethod: 'correction',
      operator,
      reason,
      previousState,
      newState,
    });
  }

  /**
   * Query audit entries
   */
  async queryEntries(query: AuditQuery): Promise<KnowledgeAuditEntry[]> {
    let results = [...this.auditLog];

    if (query.userId) {
      results = results.filter((e) => e.userId === query.userId);
    }

    if (query.knowledgeUnitId) {
      results = results.filter((e) => e.knowledgeUnitId === query.knowledgeUnitId);
    }

    if (query.action) {
      results = results.filter((e) => e.action === query.action);
    }

    if (query.contentId) {
      results = results.filter((e) => e.contentId === query.contentId);
    }

    if (query.startDate) {
      results = results.filter((e) => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter((e) => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get audit history for a user
   */
  async getUserHistory(userId: string, limit: number = 100): Promise<KnowledgeAuditEntry[]> {
    return this.queryEntries({ userId, limit });
  }

  /**
   * Get audit history for a knowledge unit
   */
  async getUnitHistory(
    knowledgeUnitId: string,
    limit: number = 100
  ): Promise<KnowledgeAuditEntry[]> {
    return this.queryEntries({ knowledgeUnitId, limit });
  }

  /**
   * Get grant count for a user
   */
  async getGrantCount(userId: string): Promise<number> {
    return this.auditLog.filter(
      (e) => e.userId === userId && e.action === 'granted'
    ).length;
  }

  /**
   * Get grant timeline for a user
   */
  async getGrantTimeline(
    userId: string
  ): Promise<Array<{ date: string; count: number }>> {
    const grants = this.auditLog.filter(
      (e) => e.userId === userId && e.action === 'granted'
    );

    const timeline = new Map<string, number>();

    for (const grant of grants) {
      const date = grant.timestamp.toISOString().split('T')[0];
      timeline.set(date, (timeline.get(date) || 0) + 1);
    }

    return Array.from(timeline.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Analyze correction impact
   */
  async analyzeCorrectionImpact(
    correctionId: string
  ): Promise<{
    affectedUsers: number;
    affectedUnits: number;
    corrections: KnowledgeAuditEntry[];
  }> {
    const corrections = this.auditLog.filter(
      (e) => e.id === correctionId || e.metadata?.correctionId === correctionId
    );

    const affectedUsers = new Set(corrections.map((c) => c.userId)).size;
    const affectedUnits = new Set(corrections.map((c) => c.knowledgeUnitId)).size;

    return {
      affectedUsers,
      affectedUnits,
      corrections,
    };
  }

  /**
   * Export audit log for compliance
   */
  async exportAuditLog(
    startDate: Date,
    endDate: Date
  ): Promise<KnowledgeAuditEntry[]> {
    return this.queryEntries({ startDate, endDate, limit: 10000 });
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    grants: number;
    revocations: number;
    corrections: number;
    uniqueUsers: number;
    uniqueUnits: number;
  }> {
    const entries = this.auditLog;

    return {
      totalEntries: entries.length,
      grants: entries.filter((e) => e.action === 'granted').length,
      revocations: entries.filter((e) => e.action === 'revoked').length,
      corrections: entries.filter((e) => e.action === 'corrected').length,
      uniqueUsers: new Set(entries.map((e) => e.userId)).size,
      uniqueUnits: new Set(entries.map((e) => e.knowledgeUnitId)).size,
    };
  }
}
