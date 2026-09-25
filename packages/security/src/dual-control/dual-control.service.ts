import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AuditPrismaClient } from '../types';

// ============================================================================
// Dual-Control Approval System (TAA §55)
//
// Production mode: Uses PostgreSQL via PrismaClient for persistent storage
// Test mode: Falls back to in-memory Map when no PrismaClient is provided
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
 * Dual-control service with PostgreSQL persistence (production) or in-memory fallback (testing).
 */
@Injectable()
export class DualControlService {
  private readonly logger = new Logger(DualControlService.name);
  private prisma: AuditPrismaClient | undefined;

  // In-memory fallback (used when no PrismaClient)
  private static inMemoryRequests = new Map<string, DualControlRequest>();

  constructor(@Optional() prismaClient?: AuditPrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Set the Prisma client (for dependency injection)
   */
  setPrismaClient(client: AuditPrismaClient): void {
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
    DualControlService.inMemoryRequests.clear();
  }

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

    if (this.isProduction) {
      const row = await this.prisma!.dualControlRequest.create({
        data: {
          id: randomUUID(),
          action,
          initiatedBy,
          resourceType,
          resourceId,
          details: details as Record<string, unknown>,
          requiredApprovals,
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      this.logger.log(
        `DUAL-CONTROL REQUEST: ${action} by ${initiatedBy} on ${resourceType}/${resourceId} — requires ${requiredApprovals} approvals`
      );

      return this.mapRowToRequest(row, []);
    }

    // In-memory fallback
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
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    DualControlService.inMemoryRequests.set(request.id, request);

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
    if (this.isProduction) {
      const row = await this.prisma!.dualControlRequest.findUnique({
        where: { id: requestId },
        include: { approvals: true },
      });

      if (!row) {
        throw new NotFoundException('Dual-control request not found');
      }

      if (row.status !== 'pending') {
        throw new ForbiddenException(`Request is ${row.status}, not pending`);
      }

      if (new Date() > (row.expiresAt as Date)) {
        await this.prisma!.dualControlRequest.update({
          where: { id: requestId },
          data: { status: 'expired' },
        });
        throw new ForbiddenException('Request has expired');
      }

      if ((row.approvals as Record<string, unknown>[]).some((a) => a.approverId === approverId)) {
        throw new ForbiddenException('User has already approved this request');
      }

      if (row.initiatedBy === approverId) {
        throw new ForbiddenException('Initiator cannot approve their own request');
      }

      await this.prisma!.dualControlApproval.create({
        data: {
          id: randomUUID(),
          requestId,
          approverId,
          approverRole,
          approvedAt: new Date(),
          notes,
        },
      });

      this.logger.log(
        `DUAL-CONTROL APPROVAL: ${approverId} (${approverRole}) approved ${row.action}`
      );

      const updatedApprovals = await this.prisma!.dualControlApproval.findMany({
        where: { requestId },
      });

      if (updatedApprovals.length >= (row.requiredApprovals as number)) {
        await this.prisma!.dualControlRequest.update({
          where: { id: requestId },
          data: { status: 'approved' },
        });
        this.logger.warn(
          `DUAL-CONTROL APPROVED: ${row.action} on ${row.resourceType}/${row.resourceId}`
        );
      }

      const updated = await this.prisma!.dualControlRequest.findUnique({
        where: { id: requestId },
        include: { approvals: true },
      });

      return this.mapRowToRequest(updated!, updated!.approvals as Record<string, unknown>[]);
    }

    // In-memory fallback
    const request = DualControlService.inMemoryRequests.get(requestId);
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

    if (request.approvals.some((a) => a.approverId === approverId)) {
      throw new ForbiddenException('User has already approved this request');
    }

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
    if (this.isProduction) {
      const row = await this.prisma!.dualControlRequest.findUnique({
        where: { id: requestId },
        include: { approvals: true },
      });

      if (!row) {
        throw new NotFoundException('Dual-control request not found');
      }

      if (row.status !== 'pending') {
        throw new ForbiddenException(`Request is ${row.status}, not pending`);
      }

      await this.prisma!.dualControlRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });

      this.logger.log(
        `DUAL-CONTROL REJECTED: ${approverId} rejected ${row.action} — reason: ${reason}`
      );

      return this.mapRowToRequest(
        { ...row, status: 'rejected' },
        row.approvals as Record<string, unknown>[]
      );
    }

    // In-memory fallback
    const request = DualControlService.inMemoryRequests.get(requestId);
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
    if (this.isProduction) {
      const row = await this.prisma!.dualControlRequest.findUnique({
        where: { id: requestId },
        include: { approvals: true },
      });

      if (!row) {
        throw new NotFoundException('Dual-control request not found');
      }

      if (row.status !== 'approved') {
        throw new ForbiddenException(`Request is ${row.status}, must be approved before execution`);
      }

      await this.prisma!.dualControlRequest.update({
        where: { id: requestId },
        data: {
          status: 'executed',
          executedAt: new Date(),
          executedBy,
        },
      });

      this.logger.warn(
        `DUAL-CONTROL EXECUTED: ${row.action} on ${row.resourceType}/${row.resourceId} by ${executedBy}`
      );

      return this.mapRowToRequest(
        { ...row, status: 'executed', executedAt: new Date(), executedBy },
        row.approvals as Record<string, unknown>[]
      );
    }

    // In-memory fallback
    const request = DualControlService.inMemoryRequests.get(requestId);
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
    if (this.isProduction) {
      const row = await this.prisma!.dualControlRequest.findUnique({
        where: { id: requestId },
        include: { approvals: true },
      });

      if (!row) {
        throw new NotFoundException('Dual-control request not found');
      }

      return this.mapRowToRequest(row, row.approvals as Record<string, unknown>[]);
    }

    // In-memory fallback
    const request = DualControlService.inMemoryRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Dual-control request not found');
    }
    return request;
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<DualControlRequest[]> {
    if (this.isProduction) {
      const rows = await this.prisma!.dualControlRequest.findMany({
        where: { status: 'pending' },
        include: { approvals: true },
        orderBy: { createdAt: 'asc' },
      });

      return rows.map((row: Record<string, unknown>) =>
        this.mapRowToRequest(row, row.approvals as Record<string, unknown>[])
      );
    }

    // In-memory fallback
    return Array.from(DualControlService.inMemoryRequests.values()).filter(
      (r) => r.status === 'pending'
    );
  }

  /**
   * Get all requests for a specific action type
   */
  async getRequestsByAction(action: DualControlAction): Promise<DualControlRequest[]> {
    if (this.isProduction) {
      const rows = await this.prisma!.dualControlRequest.findMany({
        where: { action },
        include: { approvals: true },
        orderBy: { createdAt: 'asc' },
      });

      return rows.map((row: Record<string, unknown>) =>
        this.mapRowToRequest(row, row.approvals as Record<string, unknown>[])
      );
    }

    // In-memory fallback
    return Array.from(DualControlService.inMemoryRequests.values()).filter(
      (r) => r.action === action
    );
  }

  /**
   * Map database row to request interface
   */
  private mapRowToRequest(
    row: Record<string, unknown>,
    approvals: Record<string, unknown>[]
  ): DualControlRequest {
    return {
      id: row.id as string,
      action: row.action as DualControlAction,
      initiatedBy: row.initiatedBy as string,
      resourceType: row.resourceType as string,
      resourceId: row.resourceId as string,
      details: (row.details as Record<string, unknown>) ?? {},
      requiredApprovals: row.requiredApprovals as number,
      approvals: approvals.map((a) => ({
        approverId: a.approverId as string,
        approverRole: a.approverRole as string,
        approvedAt: a.approvedAt as Date,
        notes: (a.notes as string) ?? undefined,
      })),
      status: row.status as DualControlRequest['status'],
      createdAt: row.createdAt as Date,
      expiresAt: row.expiresAt as Date,
      executedAt: (row.executedAt as Date) ?? undefined,
      executedBy: (row.executedBy as string) ?? undefined,
    };
  }
}
