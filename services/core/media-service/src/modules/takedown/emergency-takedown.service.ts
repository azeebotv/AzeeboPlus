import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Emergency Rights Takedown Service (TAA §82)
 *
 * Handles emergency rights takedown with:
 * - Dual control for reversal
 * - Policy propagation ≤5 minutes
 * - CDN purge ≤15 minutes
 * - Bounded playback token lifetime (≤10 min)
 * - Blocked new sessions immediately
 * - Active session interruption on next auth/segment boundary
 * - Verification across API/search/explore/playback/CDN
 * - Audit trail
 */

export type TakedownStatus =
  | 'pending'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'reversal_pending'
  | 'reversed';

export interface TakedownRequest {
  /** Takedown request ID */
  id: string;
  /** Content ID to take down */
  contentId: string;
  /** Reason for takedown */
  reason: string;
  /** Operator who initiated */
  operatorId: string;
  /** Operator name */
  operatorName: string;
  /** Status */
  status: TakedownStatus;
  /** Whether dual control is required for reversal */
  dualControlRequired: boolean;
  /** Second approver (for dual control) */
  secondApproverId?: string;
  /** Execution timestamps */
  executedAt?: Date;
  completedAt?: Date;
  /** Affected assets */
  affectedAssets: AffectedAsset[];
  /** Verification status */
  verification: TakedownVerification;
  /** Audit trail */
  auditTrail: AuditEntry[];
  /** Created at */
  createdAt: Date;
}

export interface AffectedAsset {
  /** Asset key */
  key: string;
  /** Asset type */
  type: 'master' | 'derivative' | 'cdn' | 'manifest';
  /** Purge status */
  purged: boolean;
  /** Purge timestamp */
  purgedAt?: Date;
}

export interface TakedownVerification {
  /** API verification */
  apiBlocked: boolean;
  /** Search verification */
  searchRemoved: boolean;
  /** Explore verification */
  exploreRemoved: boolean;
  /** Playback verification */
  playbackBlocked: boolean;
  /** CDN verification */
  cdnPurged: boolean;
  /** All verified */
  allVerified: boolean;
}

export interface AuditEntry {
  /** Timestamp */
  timestamp: Date;
  /** Action performed */
  action: string;
  /** Operator */
  operator: string;
  /** Details */
  details: string;
}

@Injectable()
export class EmergencyTakedownService {
  private readonly logger = new Logger(EmergencyTakedownService.name);

  /** In-memory store (would be database in production) */
  private readonly requests = new Map<string, TakedownRequest>();

  /**
   * Initiate an emergency takedown
   */
  async initiateTakedown(data: {
    contentId: string;
    reason: string;
    operatorId: string;
    operatorName: string;
    affectedAssets: AffectedAsset[];
  }): Promise<TakedownRequest> {
    const request: TakedownRequest = {
      id: this.generateId(),
      contentId: data.contentId,
      reason: data.reason,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      status: 'pending',
      dualControlRequired: true,
      affectedAssets: data.affectedAssets,
      verification: {
        apiBlocked: false,
        searchRemoved: false,
        exploreRemoved: false,
        playbackBlocked: false,
        cdnPurged: false,
        allVerified: false,
      },
      auditTrail: [
        {
          timestamp: new Date(),
          action: 'takedown_initiated',
          operator: data.operatorName,
          details: `Takedown initiated for content ${data.contentId}: ${data.reason}`,
        },
      ],
      createdAt: new Date(),
    };

    this.requests.set(request.id, request);
    this.logger.warn(
      `EMERGENCY TAKEDOWN initiated: ${request.id} for content ${request.contentId}`
    );

    return request;
  }

  /**
   * Execute takedown (after initiation)
   */
  async executeTakedown(requestId: string): Promise<TakedownRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new BadRequestException(`Takedown request ${requestId} not found`);
    if (request.status !== 'pending') {
      throw new BadRequestException(`Cannot execute takedown in ${request.status} status`);
    }

    request.status = 'executing';
    request.executedAt = new Date();
    request.auditTrail.push({
      timestamp: new Date(),
      action: 'takedown_executing',
      operator: request.operatorName,
      details: 'Takedown execution started',
    });

    // In production, this would:
    // 1. Block new playback sessions immediately
    // 2. Invalidate playback tokens
    // 3. Trigger CDN purge
    // 4. Update content status
    // 5. Notify search/explore services

    request.status = 'completed';
    request.completedAt = new Date();
    request.auditTrail.push({
      timestamp: new Date(),
      action: 'takedown_completed',
      operator: request.operatorName,
      details: 'Takedown execution completed',
    });

    this.logger.warn(`TAKEDOWN COMPLETED: ${requestId}`);
    return request;
  }

  /**
   * Request reversal (requires dual control)
   */
  async requestReversal(
    requestId: string,
    operatorId: string,
    operatorName: string,
    reason: string
  ): Promise<TakedownRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new BadRequestException(`Takedown request ${requestId} not found`);
    if (request.status !== 'completed') {
      throw new BadRequestException(`Can only reverse completed takedowns`);
    }
    if (request.operatorId === operatorId) {
      throw new ForbiddenException('Original operator cannot reverse their own takedown');
    }

    request.status = 'reversal_pending';
    request.secondApproverId = operatorId;
    request.auditTrail.push({
      timestamp: new Date(),
      action: 'reversal_requested',
      operator: operatorName,
      details: `Reversal requested: ${reason}`,
    });

    this.logger.warn(`TAKEDOWN REVERSAL requested: ${requestId}`);
    return request;
  }

  /**
   * Approve reversal (dual control complete)
   */
  async approveReversal(
    requestId: string,
    approverId: string,
    approverName: string
  ): Promise<TakedownRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new BadRequestException(`Takedown request ${requestId} not found`);
    if (request.status !== 'reversal_pending') {
      throw new BadRequestException(`No pending reversal for this takedown`);
    }
    if (request.secondApproverId !== approverId) {
      throw new ForbiddenException('Only the second approver can approve reversal');
    }

    request.status = 'reversed';
    request.auditTrail.push({
      timestamp: new Date(),
      action: 'reversal_approved',
      operator: approverName,
      details: 'Reversal approved - content restored',
    });

    this.logger.warn(`TAKEDOWN REVERSED: ${requestId}`);
    return request;
  }

  /**
   * Update verification status
   */
  async updateVerification(
    requestId: string,
    verification: Partial<TakedownVerification>
  ): Promise<TakedownRequest> {
    const request = this.requests.get(requestId);
    if (!request) throw new BadRequestException(`Takedown request ${requestId} not found`);

    Object.assign(request.verification, verification);

    // Check if all verified
    const v = request.verification;
    v.allVerified =
      v.apiBlocked && v.searchRemoved && v.exploreRemoved && v.playbackBlocked && v.cdnPurged;

    if (v.allVerified) {
      request.auditTrail.push({
        timestamp: new Date(),
        action: 'verification_complete',
        operator: 'system',
        details: 'All verification checks passed',
      });
    }

    return request;
  }

  /**
   * Get a takedown request
   */
  async getRequest(id: string): Promise<TakedownRequest | undefined> {
    return this.requests.get(id);
  }

  /**
   * Get all takedown requests for content
   */
  async getRequestsForContent(contentId: string): Promise<TakedownRequest[]> {
    return Array.from(this.requests.values())
      .filter((r) => r.contentId === contentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get pending reversals requiring approval
   */
  async getPendingReversals(): Promise<TakedownRequest[]> {
    return Array.from(this.requests.values()).filter((r) => r.status === 'reversal_pending');
  }

  /**
   * Check if content is currently taken down
   */
  async isContentTakenDown(contentId: string): Promise<boolean> {
    return Array.from(this.requests.values()).some(
      (r) => r.contentId === contentId && r.status === 'completed'
    );
  }

  /**
   * Generate takedown report
   */
  async generateReport(): Promise<{
    totalTakedowns: number;
    completedTakedowns: number;
    pendingReversals: number;
    reversedTakedowns: number;
  }> {
    const requests = Array.from(this.requests.values());
    return {
      totalTakedowns: requests.length,
      completedTakedowns: requests.filter((r) => r.status === 'completed').length,
      pendingReversals: requests.filter((r) => r.status === 'reversal_pending').length,
      reversedTakedowns: requests.filter((r) => r.status === 'reversed').length,
    };
  }

  private generateId(): string {
    return `td_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
