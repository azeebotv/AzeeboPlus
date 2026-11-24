import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'needs_review'] as const;
const ALLOWED_TYPES = ['image', 'video', 'audio', 'text', 'music'] as const;
// setClearance is a decision endpoint: only the two terminal outcomes may be
// set through it (pending/needs_review are workflow states, not decisions).
const DECISION_STATUSES = ['approved', 'rejected'] as const;

export interface AiProvenanceDto {
  id: string;
  contentId: string;
  contentTitle: string;
  aiTool: string;
  aiModel: string;
  generationType: string;
  attributionRequired: boolean;
  talentRestriction: boolean;
  voiceRestriction: boolean;
  likenessRestriction: boolean;
  vendorIndependenceVerified: boolean;
  clearanceStatus: string;
  clearanceNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AiProvenanceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService
  ) {}

  async list(filters: { status?: string; type?: string }): Promise<AiProvenanceDto[]> {
    const { status, type } = filters;

    if (status && status !== 'all' && !ALLOWED_STATUSES.includes(status as never)) {
      throw new BadRequestException(`Invalid clearance status: ${status}`);
    }
    if (type && type !== 'all' && !ALLOWED_TYPES.includes(type as never)) {
      throw new BadRequestException(`Invalid generation type: ${type}`);
    }

    const rows = await this.prisma.aiProvenanceRecord.findMany({
      where: {
        ...(status && status !== 'all' ? { clearanceStatus: status } : {}),
        ...(type && type !== 'all' ? { generationType: type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { content: { select: { title: true } } },
    });

    return rows.map((r) => this.toDto(r));
  }

  async setClearance(
    id: string,
    status: 'approved' | 'rejected',
    notes: string,
    actorId: string
  ): Promise<AiProvenanceDto> {
    if (!DECISION_STATUSES.includes(status as never)) {
      throw new BadRequestException(
        `Invalid clearance decision: ${status}. Allowed: ${DECISION_STATUSES.join(', ')}`
      );
    }

    const record = await this.prisma.aiProvenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`AI provenance record ${id} not found`);

    const updated = await this.prisma.aiProvenanceRecord.update({
      where: { id },
      data: {
        clearanceStatus: status,
        clearanceNotes: notes ?? record.clearanceNotes,
        clearedBy: actorId,
        clearedAt: new Date(),
      },
      include: { content: { select: { title: true } } },
    });

    await this.auditService.log({
      actorId,
      action: `ai_provenance.clearance.${status}`,
      targetType: 'ai_provenance_record',
      targetId: id,
      details: { contentId: record.contentId, notes: notes ?? record.clearanceNotes },
    });

    return this.toDto(updated);
  }

  private toDto(r: AiProvenanceRecordWithContent): AiProvenanceDto {
    return {
      id: r.id,
      contentId: r.contentId,
      contentTitle: r.content?.title ?? '(deleted content)',
      aiTool: r.aiTool,
      aiModel: r.aiModel,
      generationType: r.generationType,
      attributionRequired: r.attributionRequired,
      talentRestriction: r.talentRestriction,
      voiceRestriction: r.voiceRestriction,
      likenessRestriction: r.likenessRestriction,
      vendorIndependenceVerified: r.vendorIndependenceVerified,
      clearanceStatus: r.clearanceStatus,
      clearanceNotes: r.clearanceNotes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

interface AiProvenanceRecordWithContent {
  id: string;
  contentId: string;
  aiTool: string;
  aiModel: string;
  generationType: string;
  attributionRequired: boolean;
  talentRestriction: boolean;
  voiceRestriction: boolean;
  likenessRestriction: boolean;
  vendorIndependenceVerified: boolean;
  clearanceStatus: string;
  clearanceNotes: string;
  createdAt: Date;
  updatedAt: Date;
  content: { title: string } | null;
}
