import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Account Merge Service (TAA §49)
// ============================================================================

export type MergeStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';

export interface AccountMergeRequest {
  id: string;
  /** Primary account (survives) */
  primaryUserId: string;
  /** Secondary account (will be deleted) */
  secondaryUserId: string;
  /** Who initiated the merge */
  initiatedBy: string;
  /** Status */
  status: MergeStatus;
  /** What data was transferred */
  transferredData: string[];
  /** What data was conflicts (kept from primary) */
  conflicts: string[];
  /** Rollback information */
  rollbackData?: Record<string, unknown>;
  /** When the merge was initiated */
  createdAt: Date;
  /** When the merge completed */
  completedAt?: Date;
  /** Error message if failed */
  error?: string;
}

/**
 * In-memory store for merge requests.
 * In production, persist to database.
 */
const mergeRequests = new Map<string, AccountMergeRequest>();

@Injectable()
export class AccountMergeService {
  private readonly logger = new Logger(AccountMergeService.name);

  /**
   * Clear the in-memory store (for testing only)
   */
  static clearStore(): void {
    mergeRequests.clear();
  }

  /**
   * Initiate an account merge
   */
  async initiateMerge(
    primaryUserId: string,
    secondaryUserId: string,
    initiatedBy: string,
  ): Promise<AccountMergeRequest> {
    if (primaryUserId === secondaryUserId) {
      throw new ForbiddenException('Cannot merge an account with itself');
    }

    // Check for existing pending merge
    for (const request of mergeRequests.values()) {
      if (
        request.status === 'pending' &&
        (request.primaryUserId === primaryUserId ||
          request.secondaryUserId === secondaryUserId)
      ) {
        throw new ForbiddenException(
          'A merge is already pending for one of these accounts',
        );
      }
    }

    const request: AccountMergeRequest = {
      id: randomUUID(),
      primaryUserId,
      secondaryUserId,
      initiatedBy,
      status: 'pending',
      transferredData: [],
      conflicts: [],
      createdAt: new Date(),
    };

    mergeRequests.set(request.id, request);

    this.logger.log(
      `ACCOUNT MERGE INITIATED: ${secondaryUserId} → ${primaryUserId} by ${initiatedBy}`,
    );

    return request;
  }

  /**
   * Execute the account merge
   * This should be called within a database transaction
   */
  async executeMerge(
    requestId: string,
    transferData: (primaryId: string, secondaryId: string) => Promise<string[]>,
    conflictResolver: (
      primaryId: string,
      secondaryId: string,
    ) => Promise<string[]>,
  ): Promise<AccountMergeRequest> {
    const request = mergeRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Merge request not found');
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException(`Merge request is ${request.status}`);
    }

    request.status = 'in_progress';

    try {
      // Transfer data from secondary to primary
      const transferred = await transferData(
        request.primaryUserId,
        request.secondaryUserId,
      );
      request.transferredData = transferred;

      // Handle conflicts (keep primary data)
      const conflicts = await conflictResolver(
        request.primaryUserId,
        request.secondaryUserId,
      );
      request.conflicts = conflicts;

      // Store rollback data before deleting secondary
      request.rollbackData = {
        mergedAt: new Date().toISOString(),
        transferredData: transferred,
        conflicts,
      };

      request.status = 'completed';
      request.completedAt = new Date();

      this.logger.log(
        `ACCOUNT MERGE COMPLETED: ${request.secondaryUserId} → ${request.primaryUserId} ` +
          `(${transferred.length} items transferred, ${conflicts.length} conflicts resolved)`,
      );

      return request;
    } catch (error) {
      request.status = 'failed';
      request.error = (error as Error).message;

      this.logger.error(
        `ACCOUNT MERGE FAILED: ${request.secondaryUserId} → ${request.primaryUserId}: ${(error as Error).message}`,
      );

      throw error;
    }
  }

  /**
   * Rollback a completed merge
   */
  async rollbackMerge(requestId: string): Promise<AccountMergeRequest> {
    const request = mergeRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Merge request not found');
    }

    if (request.status !== 'completed') {
      throw new ForbiddenException(
        `Can only rollback completed merges, current status: ${request.status}`,
      );
    }

    request.status = 'rolled_back';

    this.logger.warn(
      `ACCOUNT MERGE ROLLED BACK: ${request.secondaryUserId} → ${request.primaryUserId}`,
    );

    return request;
  }

  /**
   * Get merge request by ID
   */
  async getMergeRequest(requestId: string): Promise<AccountMergeRequest> {
    const request = mergeRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Merge request not found');
    }
    return request;
  }

  /**
   * Get all merge requests for a user
   */
  async getUserMerges(userId: string): Promise<AccountMergeRequest[]> {
    return Array.from(mergeRequests.values()).filter(
      (r) => r.primaryUserId === userId || r.secondaryUserId === userId,
    );
  }
}
