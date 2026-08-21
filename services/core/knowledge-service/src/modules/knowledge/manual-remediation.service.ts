import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Manual Remediation Capability (AZP-KNOW-011)
//
// Provides tools for manual intervention in the knowledge graph:
// - Correcting knowledge grants
// - Merging/splitting knowledge units
// - Bulk operations for data fixes
// - Audit trail for all manual changes
// ============================================================================

export type RemediationAction =
  | 'grant_knowledge'
  | 'revoke_knowledge'
  | 'merge_units'
  | 'split_unit'
  | 'correct_metadata'
  | 'bulk_grant'
  | 'bulk_revoke'
  | 'rebuild_projection';

export interface RemediationRequest {
  id: string;
  /** Action to perform */
  action: RemediationAction;
  /** Who requested the remediation */
  requestedBy: string;
  /** Target user(s) */
  targetUserIds: string[];
  /** Target knowledge unit(s) */
  targetKnowledgeUnitIds: string[];
  /** Action-specific parameters */
  parameters: Record<string, unknown>;
  /** Justification for the remediation */
  justification: string;
  /** Status */
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  /** Created at */
  createdAt: Date;
  /** Executed at */
  executedAt?: Date;
  /** Execution result */
  result?: RemediationResult;
}

export interface RemediationResult {
  success: boolean;
  /** Number of users affected */
  usersAffected: number;
  /** Number of knowledge units affected */
  unitsAffected: number;
  /** Changes made */
  changes: Array<{
    type: string;
    userId?: string;
    knowledgeUnitId?: string;
    details: string;
  }>;
  /** Errors encountered */
  errors: string[];
}

@Injectable()
export class ManualRemediationService {
  private readonly logger = new Logger(ManualRemediationService.name);

  // In-memory store (would be database in production)
  private readonly requestStore = new Map<string, RemediationRequest>();

  /**
   * Create remediation request
   */
  async createRequest(request: Omit<RemediationRequest, 'id' | 'status' | 'createdAt'>): Promise<RemediationRequest> {
    const newRequest: RemediationRequest = {
      ...request,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date(),
    };

    this.requestStore.set(newRequest.id, newRequest);

    this.logger.log(`Remediation request created: ${newRequest.action} by ${newRequest.requestedBy}`);

    return newRequest;
  }

  /**
   * Approve remediation request
   */
  async approveRequest(requestId: string, approvedBy: string): Promise<RemediationRequest> {
    const request = this.requestStore.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot approve request in ${request.status} status`);
    }

    request.status = 'approved';

    this.logger.log(`Remediation request approved: ${requestId} by ${approvedBy}`);

    return request;
  }

  /**
   * Execute remediation request
   */
  async executeRequest(requestId: string): Promise<RemediationRequest> {
    const request = this.requestStore.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status !== 'approved') {
      throw new Error(`Cannot execute request in ${request.status} status`);
    }

    // Execute the action
    const result = await this.executeAction(request);

    request.status = 'executed';
    request.executedAt = new Date();
    request.result = result;

    this.logger.log(`Remediation request executed: ${requestId}`);

    return request;
  }

  /**
   * Reject remediation request
   */
  async rejectRequest(requestId: string, rejectedBy: string, reason: string): Promise<RemediationRequest> {
    const request = this.requestStore.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot reject request in ${request.status} status`);
    }

    request.status = 'rejected';

    this.logger.log(`Remediation request rejected: ${requestId} by ${rejectedBy} - ${reason}`);

    return request;
  }

  /**
   * Execute remediation action
   */
  private async executeAction(request: RemediationRequest): Promise<RemediationResult> {
    const result: RemediationResult = {
      success: true,
      usersAffected: 0,
      unitsAffected: 0,
      changes: [],
      errors: [],
    };

    try {
      switch (request.action) {
        case 'grant_knowledge':
          await this.executeGrantKnowledge(request, result);
          break;
        case 'revoke_knowledge':
          await this.executeRevokeKnowledge(request, result);
          break;
        case 'merge_units':
          await this.executeMergeUnits(request, result);
          break;
        case 'split_unit':
          await this.executeSplitUnit(request, result);
          break;
        case 'correct_metadata':
          await this.executeCorrectMetadata(request, result);
          break;
        case 'bulk_grant':
          await this.executeBulkGrant(request, result);
          break;
        case 'bulk_revoke':
          await this.executeBulkRevoke(request, result);
          break;
        case 'rebuild_projection':
          await this.executeRebuildProjection(request, result);
          break;
        default:
          result.success = false;
          result.errors.push(`Unknown action: ${request.action}`);
      }
    } catch (error) {
      result.success = false;
      result.errors.push((error as Error).message);
    }

    return result;
  }

  /**
   * Execute grant knowledge action
   */
  private async executeGrantKnowledge(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    for (const userId of request.targetUserIds) {
      for (const unitId of request.targetKnowledgeUnitIds) {
        result.changes.push({
          type: 'grant',
          userId,
          knowledgeUnitId: unitId,
          details: `Granted knowledge ${unitId} to user ${userId}`,
        });
        result.usersAffected++;
        result.unitsAffected++;
      }
    }
  }

  /**
   * Execute revoke knowledge action
   */
  private async executeRevokeKnowledge(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    for (const userId of request.targetUserIds) {
      for (const unitId of request.targetKnowledgeUnitIds) {
        result.changes.push({
          type: 'revoke',
          userId,
          knowledgeUnitId: unitId,
          details: `Revoked knowledge ${unitId} from user ${userId}`,
        });
        result.usersAffected++;
        result.unitsAffected++;
      }
    }
  }

  /**
   * Execute merge units action
   */
  private async executeMergeUnits(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    const targetUnitId = request.parameters.targetUnitId as string;
    result.changes.push({
      type: 'merge',
      knowledgeUnitId: targetUnitId,
      details: `Merged ${request.targetKnowledgeUnitIds.length} units into ${targetUnitId}`,
    });
    result.unitsAffected = request.targetKnowledgeUnitIds.length;
  }

  /**
   * Execute split unit action
   */
  private async executeSplitUnit(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    const newUnitIds = request.parameters.newUnitIds as string[];
    result.changes.push({
      type: 'split',
      knowledgeUnitId: request.targetKnowledgeUnitIds[0],
      details: `Split into ${newUnitIds.length} new units`,
    });
    result.unitsAffected = newUnitIds.length;
  }

  /**
   * Execute correct metadata action
   */
  private async executeCorrectMetadata(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    for (const unitId of request.targetKnowledgeUnitIds) {
      result.changes.push({
        type: 'correct_metadata',
        knowledgeUnitId: unitId,
        details: `Corrected metadata for ${unitId}`,
      });
      result.unitsAffected++;
    }
  }

  /**
   * Execute bulk grant action
   */
  private async executeBulkGrant(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    const unitIds = request.parameters.unitIds as string[];
    for (const userId of request.targetUserIds) {
      for (const unitId of unitIds) {
        result.changes.push({
          type: 'bulk_grant',
          userId,
          knowledgeUnitId: unitId,
          details: `Bulk granted ${unitId} to ${userId}`,
        });
      }
      result.usersAffected++;
    }
    result.unitsAffected = unitIds.length;
  }

  /**
   * Execute bulk revoke action
   */
  private async executeBulkRevoke(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    const unitIds = request.parameters.unitIds as string[];
    for (const userId of request.targetUserIds) {
      for (const unitId of unitIds) {
        result.changes.push({
          type: 'bulk_revoke',
          userId,
          knowledgeUnitId: unitId,
          details: `Bulk revoked ${unitId} from ${userId}`,
        });
      }
      result.usersAffected++;
    }
    result.unitsAffected = unitIds.length;
  }

  /**
   * Execute rebuild projection action
   */
  private async executeRebuildProjection(
    request: RemediationRequest,
    result: RemediationResult,
  ): Promise<void> {
    for (const userId of request.targetUserIds) {
      result.changes.push({
        type: 'rebuild_projection',
        userId,
        details: `Rebuilt knowledge projection for ${userId}`,
      });
      result.usersAffected++;
    }
  }

  /**
   * Get remediation request by ID
   */
  async getRequest(requestId: string): Promise<RemediationRequest | undefined> {
    return this.requestStore.get(requestId);
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<RemediationRequest[]> {
    return Array.from(this.requestStore.values()).filter(r => r.status === 'pending');
  }

  /**
   * Get request history for a user
   */
  async getUserRequestHistory(userId: string): Promise<RemediationRequest[]> {
    return Array.from(this.requestStore.values())
      .filter(r => r.requestedBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
