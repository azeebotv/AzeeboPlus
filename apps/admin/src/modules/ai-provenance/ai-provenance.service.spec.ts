import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiProvenanceService } from './ai-provenance.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * The provenance record is the compliance artifact backing the AI-disclosure
 * labels shown to users, so the tests pin the two things that matter: filters
 * must reject unknown values instead of silently returning wrong data, and
 * every clearance decision must stamp clearedBy/clearedAt and hit the audit
 * log.
 */
describe('AiProvenanceService', () => {
  let service: AiProvenanceService;
  let prisma: {
    aiProvenanceRecord: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { log: jest.Mock };

  const baseRow = {
    id: 'prov-1',
    contentId: 'content-1',
    aiTool: 'midjourney',
    aiModel: 'v6',
    generationType: 'image',
    attributionRequired: true,
    talentRestriction: false,
    voiceRestriction: false,
    likenessRestriction: true,
    vendorIndependenceVerified: false,
    clearanceStatus: 'pending',
    clearanceNotes: '',
    clearedBy: null,
    clearedAt: null,
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-01'),
    content: { title: 'Test Content' },
  };

  beforeEach(async () => {
    prisma = {
      aiProvenanceRecord: {
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
        AiProvenanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();

    service = module.get(AiProvenanceService);
  });

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns DTOs mapped with content titles', async () => {
      prisma.aiProvenanceRecord.findMany.mockResolvedValue([{ ...baseRow }]);

      const result = await service.list({});

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'prov-1',
          contentTitle: 'Test Content',
          aiTool: 'midjourney',
          clearanceStatus: 'pending',
        })
      );
    });

    it('falls back to a placeholder when the content relation is gone', async () => {
      prisma.aiProvenanceRecord.findMany.mockResolvedValue([{ ...baseRow, content: null }]);

      const result = await service.list({});

      expect(result[0].contentTitle).toBe('(deleted content)');
    });

    it('passes status and type filters to the query', async () => {
      await service.list({ status: 'pending', type: 'image' });

      expect(prisma.aiProvenanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clearanceStatus: 'pending', generationType: 'image' },
        })
      );
    });

    it('ignores the "all" sentinel instead of filtering on it', async () => {
      await service.list({ status: 'all', type: 'all' });

      expect(prisma.aiProvenanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    it('rejects unknown clearance statuses', async () => {
      await expect(service.list({ status: 'hacked' })).rejects.toThrow(BadRequestException);
    });

    it('rejects unknown generation types', async () => {
      await expect(service.list({ type: 'hologram' })).rejects.toThrow(BadRequestException);
    });
  });

  // ── setClearance ──────────────────────────────────────────────────────────

  describe('setClearance', () => {
    it('stamps the decision with clearedBy/clearedAt and persists it', async () => {
      await service.setClearance('prov-1', 'approved', 'Vendor docs verified', 'admin-a');

      expect(prisma.aiProvenanceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prov-1' },
          data: expect.objectContaining({
            clearanceStatus: 'approved',
            clearanceNotes: 'Vendor docs verified',
            clearedBy: 'admin-a',
            clearedAt: expect.any(Date),
          }),
        })
      );
    });

    it('keeps existing notes when none are provided', async () => {
      prisma.aiProvenanceRecord.findUnique.mockResolvedValue({
        ...baseRow,
        clearanceNotes: 'original note',
      });

      await service.setClearance('prov-1', 'approved', undefined as never, 'admin-a');

      expect(prisma.aiProvenanceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clearanceNotes: 'original note' }),
        })
      );
    });

    it('audits every clearance decision', async () => {
      await service.setClearance('prov-1', 'rejected', 'Unclear training provenance', 'admin-a');

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'admin-a',
          action: 'ai_provenance.clearance.rejected',
          targetType: 'ai_provenance_record',
          targetId: 'prov-1',
        })
      );
    });

    it('refuses decision values outside the closed status set', async () => {
      await expect(
        service.setClearance('prov-1', 'needs_review' as never, 'x', 'admin-a')
      ).rejects.toThrow(BadRequestException);
      expect(prisma.aiProvenanceRecord.update).not.toHaveBeenCalled();
    });

    it('404s on an unknown record', async () => {
      prisma.aiProvenanceRecord.findUnique.mockResolvedValue(null);

      await expect(service.setClearance('missing', 'approved', 'x', 'admin-a')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.aiProvenanceRecord.update).not.toHaveBeenCalled();
    });
  });
});
