import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RightsClearancesService } from './rights-clearances.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * Rights clearances gate whether content can legally run in a territory, so
 * the tests pin the search/filter contract (invalid values are rejected, not
 * ignored) and the decision workflow (decidedBy/decidedAt stamping plus an
 * audit record naming the talent and clearance type).
 */
describe('RightsClearancesService', () => {
  let service: RightsClearancesService;
  let prisma: {
    rightsClearance: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { log: jest.Mock };

  const baseRow = {
    id: 'rc-1',
    talentName: 'Ada Obi',
    type: 'talent',
    contentId: 'content-1',
    universe: 'reality',
    status: 'pending',
    expiryDate: new Date('2027-01-01'),
    clearanceScope: 'worldwide',
    regions: ['NG', 'GH'],
    notes: 'Contract #77',
    decidedBy: null,
    decidedAt: null,
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-01'),
    content: { title: 'Reality Episode 4' },
  };

  beforeEach(async () => {
    prisma = {
      rightsClearance: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ ...baseRow }),
        update: jest
          .fn()
          .mockImplementation(({ data }) => ({ ...baseRow, ...data, updatedAt: new Date() })),
      },
    };
    auditLog = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RightsClearancesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();

    service = module.get(RightsClearancesService);
  });

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns DTOs with content title and regions', async () => {
      prisma.rightsClearance.findMany.mockResolvedValue([{ ...baseRow }]);

      const result = await service.list({});

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'rc-1',
          talentName: 'Ada Obi',
          contentTitle: 'Reality Episode 4',
          regions: ['NG', 'GH'],
          status: 'pending',
        })
      );
    });

    it('falls back to a placeholder when the content relation is gone', async () => {
      prisma.rightsClearance.findMany.mockResolvedValue([{ ...baseRow, content: null }]);

      const result = await service.list({});

      expect(result[0].contentTitle).toBe('(deleted content)');
    });

    it('normalizes a non-array regions payload to an empty list', async () => {
      prisma.rightsClearance.findMany.mockResolvedValue([
        { ...baseRow, regions: { broken: true } },
      ]);

      const result = await service.list({});

      expect(result[0].regions).toEqual([]);
    });

    it('passes status and type filters to the query', async () => {
      await service.list({ status: 'approved', type: 'music' });

      expect(prisma.rightsClearance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'approved', type: 'music' },
        })
      );
    });

    it('searches talent name and content title case-insensitively', async () => {
      await service.list({ q: 'Ada' });

      expect(prisma.rightsClearance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { talentName: { contains: 'Ada', mode: 'insensitive' } },
              { content: { title: { contains: 'Ada', mode: 'insensitive' } } },
            ],
          },
        })
      );
    });

    it('ignores the "all" sentinel instead of filtering on it', async () => {
      await service.list({ status: 'all', type: 'all' });

      expect(prisma.rightsClearance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('rejects unknown statuses', async () => {
      await expect(service.list({ status: 'disputed' })).rejects.toThrow(BadRequestException);
    });

    it('maps expiry=expiring to the governance-summary window (pending/approved, ≤30 days out)', async () => {
      await service.list({ expiry: 'expiring' });

      const call = (prisma.rightsClearance.findMany as jest.Mock).mock.calls.at(-1)[0];
      expect(call.where.status).toEqual({ in: ['pending', 'approved'] });
      expect(call.where.expiryDate.gt).toBeInstanceOf(Date);
      expect(call.where.expiryDate.lte).toBeInstanceOf(Date);
      // ~30-day window: lte must be roughly 30 days ahead of gt (now).
      const days = (call.where.expiryDate.lte.getTime() - call.where.expiryDate.gt.getTime()) / 86400000;
      expect(days).toBeGreaterThan(29.9);
      expect(days).toBeLessThan(30.1);
      // Expiry-driven lists sort by soonest expiry, not recency.
      expect(call.orderBy).toEqual({ expiryDate: 'asc' });
    });

    it('maps expiry=expired to pending/approved past their expiry date', async () => {
      await service.list({ expiry: 'expired' });

      const call = (prisma.rightsClearance.findMany as jest.Mock).mock.calls.at(-1)[0];
      expect(call.where.status).toEqual({ in: ['pending', 'approved'] });
      expect(call.where.expiryDate.lte).toBeInstanceOf(Date);
      expect(call.where.expiryDate.gt).toBeUndefined();
      expect(call.orderBy).toEqual({ expiryDate: 'asc' });
    });

    it('rejects unknown expiry filters', async () => {
      await expect(service.list({ expiry: 'soon' })).rejects.toThrow(BadRequestException);
    });

    it('lets an explicit status compose with the expiry filter', async () => {
      await service.list({ expiry: 'expiring', status: 'approved' });

      const call = (prisma.rightsClearance.findMany as jest.Mock).mock.calls.at(-1)[0];
      // The expiry window's status set stays intact and the explicit status
      // does not overwrite it (composition, not clobbering).
      expect(call.where.status).toEqual({ in: ['pending', 'approved'] });
      expect(call.where.expiryDate).toBeDefined();
    });

    it('rejects unknown clearance types', async () => {
      await expect(service.list({ type: 'merch' })).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('stamps the decision with decidedBy/decidedAt and persists it', async () => {
      await service.updateStatus('rc-1', 'approved', 'admin-a');

      expect(prisma.rightsClearance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rc-1' },
          data: expect.objectContaining({
            status: 'approved',
            decidedBy: 'admin-a',
            decidedAt: expect.any(Date),
          }),
        })
      );
    });

    it('audits every decision with talent and type context', async () => {
      await service.updateStatus('rc-1', 'rejected', 'admin-b');

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin-b',
          action: 'rights_clearance.status.rejected',
          targetType: 'rights_clearance',
          targetId: 'rc-1',
          details: expect.objectContaining({ talentName: 'Ada Obi', type: 'talent' }),
        })
      );
    });

    it('refuses decision values outside the closed status set', async () => {
      await expect(
        service.updateStatus('rc-1', 'expired' as never, 'admin-a')
      ).rejects.toThrow(BadRequestException);
      expect(prisma.rightsClearance.update).not.toHaveBeenCalled();
    });

    it('404s on an unknown clearance', async () => {
      prisma.rightsClearance.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('missing', 'approved', 'admin-a')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.rightsClearance.update).not.toHaveBeenCalled();
    });
  });
});
