import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

// ============================================================================
// Immutable Audit Log (TAA §56)
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
 */
const auditLog: ImmutableAuditEntry[] = [];
let sequenceCounter = 0;
let lastHash = '0'.repeat(64); // Genesis hash

@Injectable()
export class ImmutableAuditService {
  private readonly logger = new Logger(ImmutableAuditService.name);

  /**
   * Clear the in-memory store (for testing only)
   */
  static clearStore(): void {
    auditLog.length = 0;
    sequenceCounter = 0;
    lastHash = '0'.repeat(64);
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
    sequenceCounter++;

    const newEntry: ImmutableAuditEntry = {
      id: randomUUID(),
      sequenceNumber: sequenceCounter,
      hash: '', // Will be computed
      previousHash: lastHash,
      ...entry,
      timestamp: new Date(),
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
    lastHash = newEntry.hash;

    // Append-only — no modification possible
    auditLog.push(newEntry);

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
    let results = [...auditLog];

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

    // Return in chronological order
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

    for (let i = 0; i < auditLog.length; i++) {
      const entry = auditLog[i];

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
      totalEntries: auditLog.length,
      errors,
    };
  }

  /**
   * Get the last entry in the chain
   */
  async getLastEntry(): Promise<ImmutableAuditEntry | undefined> {
    return auditLog[auditLog.length - 1];
  }

  /**
   * Get total entry count
   */
  async getEntryCount(): Promise<number> {
    return auditLog.length;
  }
}
