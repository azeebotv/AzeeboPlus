import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'expired'] as const;
const ALLOWED_TYPES = ['talent', 'music', 'likeness', 'voice'] as const;
// updateStatus is a decision endpoint: only the two terminal outcomes may be
// set through it (pending is a workflow state; expired is system-driven).
const DECISION_STATUSES = ['approved', 'rejected'] as const;

export interface RightsClearanceDto {
  id: string;
  talentName: string;
  type: string;
  contentId: string;
  contentTitle: string;
  universe: string;
  status: string;
  expiryDate: Date | null;
  clearanceScope: string;
  regions: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RightsClearancesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService
  ) {}

  async list(filters: { status?: string; type?: string; q?: string }): Promise<RightsClearanceDto[]> {
    const { status, type, q } = filters;

    if (status && status !== 'all' && !ALLOWED_STATUSES.includes(status as never)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    if (type && type !== 'all' && !ALLOWED_TYPES.includes(type as never)) {
      throw new BadRequestException(`Invalid clearance type: ${type}`);
    }

    const rows = await this.prisma.rightsClearance.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(type && type !== 'all' ? { type } : {}),
        ...(q
          ? {
              OR: [
                { talentName: { contains: q, mode: 'insensitive' as const } },
                { content: { title: { contains: q, mode: 'insensitive' as const } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { content: { select: { title: true } } },
    });

    return rows.map((r) => this.toDto(r));
  }

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    actorId: string
  ): Promise<RightsClearanceDto> {
    if (!DECISION_STATUSES.includes(status as never)) {
      throw new BadRequestException(
        `Invalid clearance decision: ${status}. Allowed: ${DECISION_STATUSES.join(', ')}`
      );
    }

    const clearance = await this.prisma.rightsClearance.findUnique({ where: { id } });
    if (!clearance) throw new NotFoundException(`Rights clearance ${id} not found`);

    const updated = await this.prisma.rightsClearance.update({
      where: { id },
      data: { status, decidedBy: actorId, decidedAt: new Date() },
      include: { content: { select: { title: true } } },
    });

    await this.auditService.log({
      actorId,
      action: `rights_clearance.status.${status}`,
      targetType: 'rights_clearance',
      targetId: id,
      details: { talentName: clearance.talentName, type: clearance.type },
    });

    return this.toDto(updated);
  }

  private toDto(r: RightsClearanceRow): RightsClearanceDto {
    return {
      id: r.id,
      talentName: r.talentName,
      type: r.type,
      contentId: r.contentId,
      contentTitle: r.content?.title ?? '(deleted content)',
      universe: r.universe,
      status: r.status,
      expiryDate: r.expiryDate,
      clearanceScope: r.clearanceScope,
      regions: Array.isArray(r.regions) ? (r.regions as string[]) : [],
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

interface RightsClearanceRow {
  id: string;
  talentName: string;
  type: string;
  contentId: string;
  universe: string;
  status: string;
  expiryDate: Date | null;
  clearanceScope: string;
  regions: unknown;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  content: { title: string } | null;
}
