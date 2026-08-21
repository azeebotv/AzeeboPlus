import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Dual-Control Approval System (TAA §55)
// ============================================================================

export type DualControlAction =
  | 'large-refund'
  | 'premium-entitlement'
  | 'rights-override'
  | 'scheduled-publication'
  | 'mass-reward-adjustment'
  | 'feature-flag-activation'
  | 'break-glass-access';

export interface DualControlRequest {
  id: string;
  /** Action type */
  action: DualControlAction;
  /** Who initiated the action */
  initiatedBy: string;
  /** Target resource */
  resourceType: string;
  resourceId: string;
  /** Action details */
  details: Record<string, unknown>;
  /** Approval threshold (number of approvers required) */
  requiredApprovals: number;
  /** Current approvals */
  approvals: DualControlApproval[];
  /** Status */
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
  /** When the request was created */
  createdAt: Date;
  /** When the request expires (24 hours) */
  expiresAt: Date;
  /** When the action was executed */
  executedAt?: Date;
  /** Who executed the action */
  executedBy?: string;
}

export interface DualControlApproval {
  approverId: string;
  approverRole: string;
  approvedAt: Date;
  notes?: string;
}

/** Thresholds for different action types */
const ACTION_THRESHOLDS: Record<DualControlAction, number> = {
  'large-refund': 2,
  'premium-entitlement': 2,
  'rights-override': 2,
  'scheduled-publication': 1,
  'mass-reward-adjustment': 2,
  'feature-flag-activation': 1,
  'break-glass-access': 2,
};

/**
 * In-memory store for dual-control requests.
 * In production, persist to database with restricted write access.
 */
const dualControlRequests = new Map<string, DualControlRequest>();

@Injectable()
export class DualControlService {
  private readonly logger = new Logger(DualControlService.name);

  /**
   * Create a new dual-control request
   */
  async createRequest(
    action: DualControlAction,
    initiatedBy: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown>
  ): Promise<DualControlRequest> {
    const requiredApprovals = ACTION_THRESHOLDS[action];

    const request: DualControlRequest = {
      id: randomUUID(),
      action,
      initiatedBy,
      resourceType,
      resourceId,
      details,
      requiredApprovals,
      approvals: [],
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    dualControlRequests.set(request.id, request);

    this.logger.log(
      `DUAL-CONTROL REQUEST: ${action} by ${initiatedBy} on ${resourceType}/${resourceId} — requires ${requiredApprovals} approvals`
    );

    return request;
  }

  /**
   * Approve a dual-control request
   */
  async approve(
    requestId: string,
    approverId: string,
    approverRole: string,
    notes?: string
  ): Promise<DualControlRequest> {
    const request = dualControlRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Dual-control request not found');
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException(`Request is ${request.status}, not pending`);
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      throw new ForbiddenException('Request has expired');
    }

    // Check if already approved by this user
    if (request.approvals.some((a) => a.approverId === approverId)) {
      throw new ForbiddenException('User has already approved this request');
    }

    // Check if initiator is trying to approve their own request
    if (request.initiatedBy === approverId) {
      throw new ForbiddenException('Initiator cannot approve their own request');
    }

    request.approvals.push({
      approverId,
      approverRole,
      approvedAt: new Date(),
      notes,
    });

    this.logger.log(
      `DUAL-CONTROL APPROVAL: ${approverId} (${approverRole}) approved ${request.action} — ` +
        `${request.approvals.length}/${request.requiredApprovals} approvals`
    );

    // Check if threshold met
    if (request.approvals.length >= request.requiredApprovals) {
      request.status = 'approved';
      this.logger.warn(
        `DUAL-CONTROL APPROVED: ${request.action} on ${request.resourceType}/${request.resourceId} ` +
          `approved by ${request.approvals.map((a) => a.approverId).join(', ')}`
      );
    }

    return request;
  }

  /**
   * Reject a dual-control request
   */
  async reject(requestId: string, approverId: string, reason: string): Promise<DualControlRequest> {
    const request = dualControlRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Dual-control request not found');
    }

    if (request.status !== 'pending') {
      throw new ForbiddenException(`Request is ${request.status}, not pending`);
    }

    request.status = 'rejected';

    this.logger.log(
      `DUAL-CONTROL REJECTED: ${approverId} rejected ${request.action} — reason: ${reason}`
    );

    return request;
  }

  /**
   * Execute an approved dual-control action
   */
  async execute(requestId: string, executedBy: string): Promise<DualControlRequest> {
    const request = dualControlRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Dual-control request not found');
    }

    if (request.status !== 'approved') {
      throw new ForbiddenException(
        `Request is ${request.status}, must be approved before execution`
      );
    }

    request.status = 'executed';
    request.executedAt = new Date();
    request.executedBy = executedBy;

    this.logger.warn(
      `DUAL-CONTROL EXECUTED: ${request.action} on ${request.resourceType}/${request.resourceId} ` +
        `by ${executedBy} (approved by ${request.approvals.map((a) => a.approverId).join(', ')})`
    );

    return request;
  }

  /**
   * Get a dual-control request by ID
   */
  async getRequest(requestId: string): Promise<DualControlRequest> {
    const request = dualControlRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Dual-control request not found');
    }
    return request;
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<DualControlRequest[]> {
    return Array.from(dualControlRequests.values()).filter((r) => r.status === 'pending');
  }

  /**
   * Get all requests for a specific action type
   */
  async getRequestsByAction(action: DualControlAction): Promise<DualControlRequest[]> {
    return Array.from(dualControlRequests.values()).filter((r) => r.action === action);
  }
}
