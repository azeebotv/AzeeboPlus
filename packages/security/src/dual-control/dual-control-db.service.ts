import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Dual-Control Approval System — Database-Backed Implementation (TAA §55)
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
  action: DualControlAction;
  initiatedBy: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  requiredApprovals: number;
  approvals: DualControlApproval[];
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  executedAt?: Date;
  executedBy?: string;
}

export interface DualControlApproval {
  approverId: string;
  approverRole: string;
  approvedAt: Date;
  notes?: string;
}

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
 * Database-backed dual-control service.
 * Uses PostgreSQL for persistent approval workflow with audit trail.
 */
@Injectable()
export class DualControlDbService {
  private readonly logger = new Logger(DualControlDbService.name);
  private prisma: any;

  constructor(prismaClient?: any) {
    this.prisma = prismaClient;
  }

  setPrismaClient(client: any): void {
    this.prisma = client;
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

    const row = await this.prisma.dualControlRequest.create({
      data: {
        id: randomUUID(),
        action,
        initiatedBy,
        resourceType,
        resourceId,
        details: details as any,
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

  /**
   * Approve a dual-control request
   */
  async approve(
    requestId: string,
    approverId: string,
    approverRole: string,
    notes?: string
  ): Promise<DualControlRequest> {
    const row = await this.prisma.dualControlRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    });

    if (!row) {
      throw new NotFoundException('Dual-control request not found');
    }

    if (row.status !== 'pending') {
      throw new ForbiddenException(`Request is ${row.status}, not pending`);
    }

    if (new Date() > row.expiresAt) {
      await this.prisma.dualControlRequest.update({
        where: { id: requestId },
        data: { status: 'expired' },
      });
      throw new ForbiddenException('Request has expired');
    }

    // Check if already approved by this user
    if (row.approvals.some((a: any) => a.approverId === approverId)) {
      throw new ForbiddenException('User has already approved this request');
    }

    // Check if initiator is trying to approve their own request
    if (row.initiatedBy === approverId) {
      throw new ForbiddenException('Initiator cannot approve their own request');
    }

    // Add approval
    await this.prisma.dualControlApproval.create({
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

    // Check if threshold met
    const updatedApprovals = await this.prisma.dualControlApproval.findMany({
      where: { requestId },
    });

    if (updatedApprovals.length >= row.requiredApprovals) {
      await this.prisma.dualControlRequest.update({
        where: { id: requestId },
        data: { status: 'approved' },
      });
      this.logger.warn(
        `DUAL-CONTROL APPROVED: ${row.action} on ${row.resourceType}/${row.resourceId}`
      );
    }

    // Re-fetch with updated approvals
    const updated = await this.prisma.dualControlRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    });

    return this.mapRowToRequest(updated, updated.approvals);
  }

  /**
   * Reject a dual-control request
   */
  async reject(requestId: string, approverId: string, reason: string): Promise<DualControlRequest> {
    const row = await this.prisma.dualControlRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    });

    if (!row) {
      throw new NotFoundException('Dual-control request not found');
    }

    if (row.status !== 'pending') {
      throw new ForbiddenException(`Request is ${row.status}, not pending`);
    }

    await this.prisma.dualControlRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    this.logger.log(
      `DUAL-CONTROL REJECTED: ${approverId} rejected ${row.action} — reason: ${reason}`
    );

    return this.mapRowToRequest({ ...row, status: 'rejected' }, row.approvals);
  }

  /**
   * Execute an approved dual-control action
   */
  async execute(requestId: string, executedBy: string): Promise<DualControlRequest> {
    const row = await this.prisma.dualControlRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    });

    if (!row) {
      throw new NotFoundException('Dual-control request not found');
    }

    if (row.status !== 'approved') {
      throw new ForbiddenException(`Request is ${row.status}, must be approved before execution`);
    }

    await this.prisma.dualControlRequest.update({
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
      row.approvals
    );
  }

  /**
   * Get a dual-control request by ID
   */
  async getRequest(requestId: string): Promise<DualControlRequest> {
    const row = await this.prisma.dualControlRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    });

    if (!row) {
      throw new NotFoundException('Dual-control request not found');
    }

    return this.mapRowToRequest(row, row.approvals);
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<DualControlRequest[]> {
    const rows = await this.prisma.dualControlRequest.findMany({
      where: { status: 'pending' },
      include: { approvals: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row: any) => this.mapRowToRequest(row, row.approvals));
  }

  /**
   * Get all requests for a specific action type
   */
  async getRequestsByAction(action: DualControlAction): Promise<DualControlRequest[]> {
    const rows = await this.prisma.dualControlRequest.findMany({
      where: { action },
      include: { approvals: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row: any) => this.mapRowToRequest(row, row.approvals));
  }

  /**
   * Map database row to request interface
   */
  private mapRowToRequest(row: any, approvals: any[]): DualControlRequest {
    return {
      id: row.id,
      action: row.action,
      initiatedBy: row.initiatedBy,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      details: (row.details as Record<string, unknown>) ?? {},
      requiredApprovals: row.requiredApprovals,
      approvals: approvals.map((a: any) => ({
        approverId: a.approverId,
        approverRole: a.approverRole,
        approvedAt: a.approvedAt,
        notes: a.notes ?? undefined,
      })),
      status: row.status,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      executedAt: row.executedAt ?? undefined,
      executedBy: row.executedBy ?? undefined,
    };
  }
}
