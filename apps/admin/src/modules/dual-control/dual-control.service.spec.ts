import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DualControlService } from './dual-control.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * TAA §55 — the two-person-integrity rule is the whole point of this module:
 * the requester can never approve (either round), the second approver must be
 * a different admin from the first, and terminal states are immutable.
 */
describe('DualControlService — two-person integrity', () => {
  let service: DualControlService;
  let prisma: {
    dualControlRequest: {
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let auditLog: { log: jest.Mock };

  const baseRow = {
    id: 'dc-1',
    actionType: 'large_refund',
    description: 'Refund order #1234',
    requestedBy: 'admin-requester',
    amount: 50000,
    currency: 'NGN',
    targetUserIds: null,
    status: 'pending',
    firstApprover: null,
    firstApprovedAt: null,
    secondApprover: null,
    secondApprovedAt: null,
    rejectionReason: null,
    rejectedAt: null,
    executedAt: null,
    createdAt: new Date('2026-09-01'),
  };

  beforeEach(async () => {
    prisma = {
      dualControlRequest: {
        findUnique: jest.fn().mockResolvedValue({ ...baseRow }),
        update: jest.fn().mockImplementation(({ data }) => ({ ...baseRow, ...data })),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => ({
          ...baseRow,
          ...data,
          id: 'dc-new',
          firstApprovedAt: null,
          secondApprovedAt: null,
          rejectedAt: null,
          executedAt: null,
        })),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ displayName: 'Admin User' }) },
    };
    auditLog = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DualControlService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();

    service = module.get(DualControlService);
  });

  it('moves a pending request to first_approved on first approval', async () => {
    const result = await service.approve('dc-1', 'admin-a');

    expect(prisma.dualControlRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dc-1' },
        data: expect.objectContaining({ status: 'first_approved', firstApprover: 'admin-a' }),
      })
    );
    expect(result.status).toBe('first_approved');
  });

  it('completes approval with a second, distinct admin', async () => {
    prisma.dualControlRequest.findUnique.mockResolvedValue({
      ...baseRow,
      status: 'first_approved',
      firstApprover: 'admin-a',
    });

    const result = await service.approve('dc-1', 'admin-b');

    expect(prisma.dualControlRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'approved', secondApprover: 'admin-b' }),
      })
    );
    expect(result.status).toBe('approved');
  });

  it('blocks the requester from approving (first round)', async () => {
    await expect(service.approve('dc-1', 'admin-requester')).rejects.toThrow(ForbiddenException);
    expect(prisma.dualControlRequest.update).not.toHaveBeenCalled();
  });

  it('blocks the requester from approving (second round)', async () => {
    prisma.dualControlRequest.findUnique.mockResolvedValue({
      ...baseRow,
      status: 'first_approved',
      firstApprover: 'admin-a',
    });

    await expect(service.approve('dc-1', 'admin-requester')).rejects.toThrow(ForbiddenException);
  });

  it('blocks the same admin approving twice', async () => {
    prisma.dualControlRequest.findUnique.mockResolvedValue({
      ...baseRow,
      status: 'first_approved',
      firstApprover: 'admin-a',
    });

    await expect(service.approve('dc-1', 'admin-a')).rejects.toThrow(ConflictException);
  });

  it('refuses to approve a rejected request', async () => {
    prisma.dualControlRequest.findUnique.mockResolvedValue({
      ...baseRow,
      status: 'rejected',
      rejectionReason: 'nope',
    });

    await expect(service.approve('dc-1', 'admin-a')).rejects.toThrow(ConflictException);
  });

  it('requires a reason on rejection and blocks the requester rejecting', async () => {
    await expect(service.reject('dc-1', '   ', 'admin-a')).rejects.toThrow(BadRequestException);
    await expect(service.reject('dc-1', 'fraud suspected', 'admin-requester')).rejects.toThrow(
      ForbiddenException
    );
  });

  it('audits every approval transition', async () => {
    await service.approve('dc-1', 'admin-a');
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dual_control.first_approval', targetId: 'dc-1' })
    );
  });
});

describe('DualControlService — request creation', () => {
  let service: DualControlService;
  let prisma: {
    dualControlRequest: {
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let auditLog: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      dualControlRequest: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'dc-new',
          actionType: data.actionType,
          description: data.description,
          requestedBy: data.requestedBy,
          amount: data.amount ?? null,
          currency: data.currency ?? null,
          targetUserIds: data.targetUserIds ?? null,
          status: data.status,
          firstApprover: null,
          firstApprovedAt: null,
          secondApprover: null,
          secondApprovedAt: null,
          rejectionReason: null,
          rejectedAt: null,
          executedAt: null,
          createdAt: new Date('2026-09-15'),
        })),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ displayName: 'Admin User' }) },
    };
    auditLog = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DualControlService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();

    service = module.get(DualControlService);
  });

  it('creates a pending request with a valid action type', async () => {
    const result = await service.create(
      {
        actionType: 'large_refund',
        description: 'Refund order #1234',
        amount: 50000,
        currency: 'NGN',
      },
      'admin-a'
    );

    expect(prisma.dualControlRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'large_refund',
          status: 'pending',
          requestedBy: 'admin-a',
        }),
      })
    );
    expect(result.status).toBe('pending');
    expect(result.requestedBy).toBe('admin-a');
  });

  it('rejects an unknown action type with the allowed list', async () => {
    await expect(
      service.create({ actionType: 'nuke_database', description: 'nope' }, 'admin-a')
    ).rejects.toThrow(BadRequestException);
    expect(prisma.dualControlRequest.create).not.toHaveBeenCalled();
  });

  it('rejects empty or whitespace descriptions', async () => {
    await expect(
      service.create({ actionType: 'bulk_operation', description: '   ' }, 'admin-a')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects non-positive or non-numeric amounts', async () => {
    await expect(
      service.create(
        { actionType: 'large_refund', description: 'x', amount: -5, currency: 'NGN' },
        'admin-a'
      )
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create(
        { actionType: 'large_refund', description: 'x', amount: 'abc', currency: 'NGN' },
        'admin-a'
      )
    ).rejects.toThrow(BadRequestException);
  });

  it('requires currency when an amount is provided', async () => {
    await expect(
      service.create(
        { actionType: 'large_refund', description: 'x', amount: 100 },
        'admin-a'
      )
    ).rejects.toThrow('Currency is required when an amount is provided');
  });

  it('audits the creation', async () => {
    await service.create({ actionType: 'data_export', description: 'Export user list' }, 'admin-a');
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dual_control.created' })
    );
  });

  it('refuses to create without an actor identity', async () => {
    await expect(
      service.create({ actionType: 'data_export', description: 'Export' }, '')
    ).rejects.toThrow(BadRequestException);
  });
});
