import { Inject, Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

// High-risk operation types eligible for dual control (TAA §55; mirrors the
// web admin page's DualControlAction.actionType union).
const ALLOWED_ACTION_TYPES = [
  'large_refund',
  'manual_entitlement',
  'bulk_operation',
  'data_export',
  'account_modification',
] as const;

export type DualControlActionType = (typeof ALLOWED_ACTION_TYPES)[number];

const ALLOWED_STATUSES = [
  'pending',
  'first_approved',
  'approved',
  'rejected',
  'executed',
] as const;

/** Virtual status for the governance drill-down: anything awaiting a human
 * decision (first or second round), matching the dashboard's
 * "Awaiting Approval" counter (status in [pending, first_approved]). */
const AWAITING_STATUSES = ['pending', 'first_approved'] as const;

export interface DualControlRequestDto {
  id: string;
  actionType: string;
  description: string;
  requestedBy: string;
  requestedByName?: string | null;
  amount?: string | null;
  currency?: string | null;
  targetUserIds?: string[];
  status: string;
  firstApprover?: string | null;
  firstApproverName?: string | null;
  firstApprovedAt?: Date | null;
  secondApprover?: string | null;
  secondApproverName?: string | null;
  secondApprovedAt?: Date | null;
  rejectionReason?: string | null;
  executedAt?: Date | null;
  createdAt: Date;
}

@Injectable()
export class DualControlService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService
  ) {}

  async list(filters: {
    status?: string;
  }): Promise<{ actions: DualControlRequestDto[]; stats: Record<string, number> }> {
    const { status } = filters;
    if (
      status &&
      status !== 'all' &&
      status !== 'awaiting' &&
      !ALLOWED_STATUSES.includes(status as never)
    ) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const rows = await this.prisma.dualControlRequest.findMany({
      where:
        status && status !== 'all'
          ? status === 'awaiting'
            ? { status: { in: [...AWAITING_STATUSES] } }
            : { status }
          : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const actions = await Promise.all(rows.map((r) => this.toDto(r)));

    // Stats are computed over the whole table, not the filtered page.
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [totalPending, awaitingFirst, awaitingSecond, executedThisMonth] = await Promise.all([
      // Anything still short of full approval counts as pending overall.
      this.prisma.dualControlRequest.count({ where: { status: { in: ['pending', 'first_approved'] } } }),
      this.prisma.dualControlRequest.count({ where: { status: 'pending' } }),
      this.prisma.dualControlRequest.count({ where: { status: 'first_approved' } }),
      this.prisma.dualControlRequest.count({
        where: { status: 'executed', executedAt: { gte: monthStart } },
      }),
    ]);

    return {
      actions,
      stats: { totalPending, awaitingFirstApproval: awaitingFirst, awaitingSecondApproval: awaitingSecond, executedThisMonth },
    };
  }

  /**
   * POST /admin/dual-control — open a new dual-control request. Creation is
   * itself audited so every high-risk action has a requester on record before
   * any approval round begins.
   */
  async create(
    input: {
      actionType: string;
      description: string;
      amount?: number | string | null;
      currency?: string | null;
      targetUserIds?: string[] | null;
    },
    actorId: string
  ): Promise<DualControlRequestDto> {
    if (!actorId) throw new BadRequestException('Actor identity is required to create a request');

    const { actionType, description, amount, currency, targetUserIds } = input;

    if (!ALLOWED_ACTION_TYPES.includes(actionType as DualControlActionType)) {
      throw new BadRequestException(
        `Invalid action type: ${actionType}. Allowed: ${ALLOWED_ACTION_TYPES.join(', ')}`
      );
    }
    if (!description || !description.trim()) {
      throw new BadRequestException('A description of the requested action is required');
    }
    if (description.trim().length > 2000) {
      throw new BadRequestException('Description must be 2000 characters or fewer');
    }

    let normalizedAmount: number | null = null;
    if (amount !== undefined && amount !== null && amount !== '') {
      const parsed = typeof amount === 'string' ? Number(amount) : amount;
      if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed <= 0) {
        throw new BadRequestException('Amount must be a positive number');
      }
      normalizedAmount = parsed;
    }
    if (normalizedAmount !== null && (!currency || !currency.trim())) {
      throw new BadRequestException('Currency is required when an amount is provided');
    }

    const created = await this.prisma.dualControlRequest.create({
      data: {
        actionType,
        description: description.trim(),
        requestedBy: actorId,
        amount: normalizedAmount,
        currency: currency?.trim() || null,
        targetUserIds:
          Array.isArray(targetUserIds) && targetUserIds.length > 0 ? targetUserIds : undefined,
        status: 'pending',
      },
    });

    await this.auditService.log({
      actorId,
      action: 'dual_control.created',
      targetType: 'dual_control_request',
      targetId: created.id,
      details: { actionType, description: created.description },
    });

    return this.toDto(created);
  }

  async approve(id: string, actorId: string): Promise<DualControlRequestDto> {
    if (!actorId) throw new BadRequestException('Actor identity is required to approve');

    const request = await this.prisma.dualControlRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`Dual-control request ${id} not found`);
    if (request.status === 'rejected' || request.status === 'executed') {
      throw new ConflictException(`Request is already ${request.status}`);
    }
    // TAA §55 — the requester can never be an approver, on either round.
    if (request.requestedBy === actorId) {
      throw new ForbiddenException('Self-approval is not permitted for dual-control actions');
    }

    if (request.status === 'pending') {
      const updated = await this.prisma.dualControlRequest.update({
        where: { id },
        data: { status: 'first_approved', firstApprover: actorId, firstApprovedAt: new Date() },
      });
      await this.auditService.log({
        actorId,
        action: 'dual_control.first_approval',
        targetType: 'dual_control_request',
        targetId: id,
        details: { actionType: request.actionType },
      });
      return this.toDto(updated);
    }

    if (request.status === 'first_approved') {
      // The two approvals must come from different admins.
      if (request.firstApprover === actorId) {
        throw new ConflictException('This request already has your approval — a second, distinct admin must approve');
      }
      const updated = await this.prisma.dualControlRequest.update({
        where: { id },
        data: { status: 'approved', secondApprover: actorId, secondApprovedAt: new Date() },
      });
      await this.auditService.log({
        actorId,
        action: 'dual_control.second_approval',
        targetType: 'dual_control_request',
        targetId: id,
        details: { actionType: request.actionType, fullyApproved: true },
      });
      return this.toDto(updated);
    }

    throw new ConflictException(`Request in status ${request.status} cannot be approved`);
  }

  async reject(id: string, reason: string, actorId: string): Promise<DualControlRequestDto> {
    if (!actorId) throw new BadRequestException('Actor identity is required to reject');
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }
    if (actorId === (await this.getRequester(id))) {
      throw new ForbiddenException('The requester cannot reject their own request');
    }

    const request = await this.prisma.dualControlRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException(`Dual-control request ${id} not found`);
    if (!['pending', 'first_approved'].includes(request.status)) {
      throw new ConflictException(`Request in status ${request.status} cannot be rejected`);
    }

    const updated = await this.prisma.dualControlRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason.trim(),
        rejectedBy: actorId,
        rejectedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'dual_control.rejected',
      targetType: 'dual_control_request',
      targetId: id,
      details: { actionType: request.actionType, reason: reason.trim() },
    });

    return this.toDto(updated);
  }

  private async getRequester(id: string): Promise<string | undefined> {
    const row = await this.prisma.dualControlRequest.findUnique({
      where: { id },
      select: { requestedBy: true },
    });
    return row?.requestedBy;
  }

  private async toDto(r: DualControlRequestRow): Promise<DualControlRequestDto> {
    const requester = r.requestedBy
      ? await this.prisma.user.findUnique({ where: { id: r.requestedBy }, select: { displayName: true } })
      : null;
    const first = r.firstApprover
      ? await this.prisma.user.findUnique({ where: { id: r.firstApprover }, select: { displayName: true } })
      : null;
    const second = r.secondApprover
      ? await this.prisma.user.findUnique({ where: { id: r.secondApprover }, select: { displayName: true } })
      : null;

    return {
      id: r.id,
      actionType: r.actionType,
      description: r.description,
      requestedBy: r.requestedBy,
      requestedByName: requester?.displayName ?? null,
      amount: r.amount != null ? String(r.amount) : null,
      currency: r.currency,
      targetUserIds: Array.isArray(r.targetUserIds) ? (r.targetUserIds as string[]) : undefined,
      status: r.status,
      firstApprover: r.firstApprover,
      firstApproverName: first?.displayName ?? null,
      firstApprovedAt: r.firstApprovedAt,
      secondApprover: r.secondApprover,
      secondApproverName: second?.displayName ?? null,
      secondApprovedAt: r.secondApprovedAt,
      rejectionReason: r.rejectionReason,
      executedAt: r.executedAt,
      createdAt: r.createdAt,
    };
  }
}

interface DualControlRequestRow {
  id: string;
  actionType: string;
  description: string;
  requestedBy: string;
  amount: unknown;
  currency: string | null;
  targetUserIds: unknown;
  status: string;
  firstApprover: string | null;
  firstApprovedAt: Date | null;
  secondApprover: string | null;
  secondApprovedAt: Date | null;
  rejectionReason: string | null;
  executedAt: Date | null;
  createdAt: Date;
}
