import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface KnowledgeProjectionResult {
  userId: string;
  knownUnitIds: string[];
  projectionVersion: number;
  lastComputedAt: Date;
}

export interface CanonicalEventInput {
  eventCode: string;
  title: string;
  description?: string;
  universeId: string;
  eventDate: Date;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeUnitInput {
  canonicalEventId: string;
  title: string;
  description?: string;
  knowledgeType: string;
  spoilerLevel?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeGrantInput {
  userId: string;
  knowledgeUnitId: string;
  grantSource: string;
  sourceId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // Canonical Events (TAA §16)
  // ==========================================================================

  async createCanonicalEvent(input: CanonicalEventInput) {
    this.logger.log(`Creating canonical event: ${input.eventCode}`);

    const existing = await this.prisma.canonicalEvent.findUnique({
      where: { eventCode: input.eventCode },
    });

    if (existing) {
      throw new BadRequestException(`Canonical event with code ${input.eventCode} already exists`);
    }

    return this.prisma.canonicalEvent.create({
      data: {
        eventCode: input.eventCode,
        title: input.title,
        description: input.description,
        universeId: input.universeId,
        eventDate: input.eventDate,
        metadata: input.metadata,
      },
    });
  }

  async getCanonicalEvent(id: string) {
    const event = await this.prisma.canonicalEvent.findUnique({
      where: { id },
      include: {
        knowledgeUnits: true,
        contentCheckpoints: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Canonical event ${id} not found`);
    }

    return event;
  }

  async updateCanonicalEventVersion(id: string, metadata?: Record<string, unknown>) {
    this.logger.log(`Superseding canonical event: ${id}`);

    const event = await this.prisma.canonicalEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Canonical event ${id} not found`);
    }

    return this.prisma.canonicalEvent.update({
      where: { id },
      data: {
        version: event.version + 1,
        metadata: {
          ...(event.metadata as Record<string, unknown>),
          ...metadata,
          supersededAt: new Date().toISOString(),
        },
      },
    });
  }

  // ==========================================================================
  // Knowledge Units (TAA §16)
  // ==========================================================================

  async createKnowledgeUnit(input: KnowledgeUnitInput) {
    this.logger.log(`Creating knowledge unit for event: ${input.canonicalEventId}`);

    const event = await this.prisma.canonicalEvent.findUnique({
      where: { id: input.canonicalEventId },
    });

    if (!event) {
      throw new NotFoundException(`Canonical event ${input.canonicalEventId} not found`);
    }

    return this.prisma.knowledgeUnit.create({
      data: {
        canonicalEventId: input.canonicalEventId,
        title: input.title,
        description: input.description,
        knowledgeType: input.knowledgeType,
        spoilerLevel: input.spoilerLevel || 'none',
        metadata: input.metadata,
      },
    });
  }

  async getKnowledgeUnit(id: string) {
    const unit = await this.prisma.knowledgeUnit.findUnique({
      where: { id },
      include: {
        canonicalEvent: true,
        grants: true,
        equivalenceSet: true,
      },
    });

    if (!unit) {
      throw new NotFoundException(`Knowledge unit ${id} not found`);
    }

    return unit;
  }

  // ==========================================================================
  // User Knowledge Grants (TAA §16 - append-only)
  // ==========================================================================

  async grantKnowledge(input: KnowledgeGrantInput) {
    this.logger.log(`Granting knowledge ${input.knowledgeUnitId} to user ${input.userId}`);

    // Check if user already has this knowledge
    const existing = await this.prisma.userKnowledgeGrant.findUnique({
      where: {
        userId_knowledgeUnitId: {
          userId: input.userId,
          knowledgeUnitId: input.knowledgeUnitId,
        },
      },
    });

    if (existing) {
      this.logger.log(`User ${input.userId} already has knowledge unit ${input.knowledgeUnitId}`);
      return existing;
    }

    // Append-only: create new grant
    return this.prisma.userKnowledgeGrant.create({
      data: {
        userId: input.userId,
        knowledgeUnitId: input.knowledgeUnitId,
        grantSource: input.grantSource,
        sourceId: input.sourceId,
        expiresAt: input.expiresAt,
        metadata: input.metadata,
      },
    });
  }

  async getUserKnowledge(userId: string) {
    return this.prisma.userKnowledgeGrant.findMany({
      where: { userId },
      include: {
        knowledgeUnit: {
          include: {
            canonicalEvent: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async getUserKnownUnitIds(userId: string): Promise<string[]> {
    const grants = await this.prisma.userKnowledgeGrant.findMany({
      where: { userId },
      select: { knowledgeUnitId: true },
    });
    return grants.map((g: { knowledgeUnitId: string }) => g.knowledgeUnitId);
  }

  // ==========================================================================
  // Knowledge Projection (TAA §16 - read model)
  // ==========================================================================

  async computeKnowledgeProjection(userId: string): Promise<KnowledgeProjectionResult> {
    this.logger.log(`Computing knowledge projection for user: ${userId}`);

    const knownUnitIds = await this.getUserKnownUnitIds(userId);

    // Upsert projection
    const projection = await this.prisma.knowledgeProjection.upsert({
      where: { userId },
      update: {
        knownUnitIds,
        projectionVersion: { increment: 1 },
        lastComputedAt: new Date(),
      },
      create: {
        userId,
        knownUnitIds,
        projectionVersion: 1,
        lastComputedAt: new Date(),
      },
    });

    return {
      userId: projection.userId,
      knownUnitIds: projection.knownUnitIds,
      projectionVersion: projection.projectionVersion,
      lastComputedAt: projection.lastComputedAt,
    };
  }

  async getKnowledgeProjection(userId: string) {
    const projection = await this.prisma.knowledgeProjection.findUnique({
      where: { userId },
    });

    if (!projection) {
      // Compute if not exists
      return this.computeKnowledgeProjection(userId);
    }

    return projection;
  }

  // ==========================================================================
  // Cross-format Equivalence (TAA §18)
  // ==========================================================================

  async createEquivalenceSet(setCode: string, name: string, knowledgeUnitIds: string[]) {
    this.logger.log(`Creating equivalence set: ${setCode}`);

    const existing = await this.prisma.equivalenceSet.findUnique({
      where: { setCode },
    });

    if (existing) {
      throw new BadRequestException(`Equivalence set ${setCode} already exists`);
    }

    return this.prisma.equivalenceSet.create({
      data: {
        setCode,
        name,
        knowledgeUnits: {
          connect: knowledgeUnitIds.map((id) => ({ id })),
        },
      },
      include: {
        knowledgeUnits: true,
      },
    });
  }

  async getEquivalenceSet(setCode: string) {
    const set = await this.prisma.equivalenceSet.findUnique({
      where: { setCode },
      include: {
        knowledgeUnits: true,
      },
    });

    if (!set) {
      throw new NotFoundException(`Equivalence set ${setCode} not found`);
    }

    return set;
  }

  // ==========================================================================
  // Content Checkpoints (TAA §16-17)
  // ==========================================================================

  async createContentCheckpoint(input: {
    contentId: string;
    canonicalEventId: string;
    checkpointType?: string;
    title: string;
    description?: string;
    triggerCondition?: Record<string, unknown>;
  }) {
    this.logger.log(`Creating content checkpoint for content: ${input.contentId}`);

    return this.prisma.contentCheckpoint.create({
      data: {
        contentId: input.contentId,
        canonicalEventId: input.canonicalEventId,
        checkpointType: input.checkpointType || 'narrative',
        title: input.title,
        description: input.description,
        triggerCondition: input.triggerCondition,
      },
    });
  }

  async triggerCheckpoint(checkpointId: string, userId: string) {
    this.logger.log(`Triggering checkpoint ${checkpointId} for user ${userId}`);

    const checkpoint = await this.prisma.contentCheckpoint.findUnique({
      where: { id: checkpointId },
      include: {
        grants: {
          include: {
            knowledgeUnit: true,
          },
        },
      },
    });

    if (!checkpoint) {
      throw new NotFoundException(`Checkpoint ${checkpointId} not found`);
    }

    // Grant all knowledge units from this checkpoint
    const grants = [];
    for (const grant of checkpoint.grants) {
      const result = await this.grantKnowledge({
        userId,
        knowledgeUnitId: grant.knowledgeUnitId,
        grantSource: 'checkpoint',
        sourceId: checkpointId,
      });
      grants.push(result);
    }

    // Rebuild knowledge projection
    await this.computeKnowledgeProjection(userId);

    return {
      checkpointId,
      userId,
      grantsAwarded: grants.length,
      knowledgeUnitIds: checkpoint.grants.map(
        (g: { knowledgeUnitId: string }) => g.knowledgeUnitId
      ),
    };
  }

  // ==========================================================================
  // Spoiler Control (TAA §18)
  // ==========================================================================

  async filterBySpoilerLevel(unitIds: string[], maxSpoilerLevel: string): Promise<string[]> {
    const spoilerOrder = { none: 0, mild: 1, major: 2, severe: 3 };
    const maxLevel = spoilerOrder[maxSpoilerLevel as keyof typeof spoilerOrder] ?? 0;

    const units = await this.prisma.knowledgeUnit.findMany({
      where: { id: { in: unitIds } },
      select: { id: true, spoilerLevel: true },
    });

    return units
      .filter((u: { id: string; spoilerLevel: string }) => {
        const level = spoilerOrder[u.spoilerLevel as keyof typeof spoilerOrder] ?? 0;
        return level <= maxLevel;
      })
      .map((u: { id: string }) => u.id);
  }

  // ==========================================================================
  // Knowledge Correction with Audit (TAA §77)
  // ==========================================================================

  async correctKnowledgeUnit(
    unitId: string,
    corrections: {
      title?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    this.logger.log(`Correcting knowledge unit: ${unitId}`);

    const unit = await this.prisma.knowledgeUnit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException(`Knowledge unit ${unitId} not found`);
    }

    // Create new version (append audit trail)
    const newVersion = await this.prisma.knowledgeUnit.create({
      data: {
        canonicalEventId: unit.canonicalEventId,
        title: corrections.title || unit.title,
        description: corrections.description || unit.description,
        knowledgeType: unit.knowledgeType,
        spoilerLevel: unit.spoilerLevel,
        metadata: {
          ...corrections.metadata,
          correctedFrom: unitId,
          correctedAt: new Date().toISOString(),
        },
        version: unit.version + 1,
      },
    });

    return newVersion;
  }

  // ==========================================================================
  // Knowledge Projection Rebuild (TAA §77)
  // ==========================================================================

  async rebuildKnowledgeProjection(userId: string) {
    this.logger.log(`Rebuilding knowledge projection for user: ${userId}`);

    // Delete existing projection
    await this.prisma.knowledgeProjection.deleteMany({
      where: { userId },
    });

    // Recompute
    return this.computeKnowledgeProjection(userId);
  }

  // ==========================================================================
  // Reader-facing aggregates (AOU hub / What-You-Know / Locked screens)
  // ==========================================================================

  private static readonly SPOILER_ORDER = ['none', 'mild', 'major', 'severe'];

  private static readonly TYPE_ICONS: Record<string, string> = {
    fact: '📜',
    character: '👤',
    plot_point: '🎭',
    location: '🗺️',
    timeline: '⏳',
  };

  /** Aggregate counts for the AOU hub progress card. */
  async getKnowledgeSummary(userId?: string) {
    const totalUnits = await this.prisma.knowledgeUnit.count();
    let unlockedUnits = 0;
    if (userId) {
      unlockedUnits = await this.prisma.userKnowledgeGrant.count({ where: { userId } });
    }
    return {
      totalUnits,
      unlockedUnits,
      progress: totalUnits > 0 ? Math.round((unlockedUnits / totalUnits) * 100) : 0,
    };
  }

  /**
   * Per-unit view for the "What You Know" screen. Without an authenticated
   * user every unit reads as locked (knowledge-service has no anonymous
   * session today); with a userId, grants mark unlocked units.
   */
  async getWhatYouKnow(userId?: string) {
    const units: Array<{
      id: string;
      title: string;
      description: string | null;
      knowledgeType: string;
    }> = await this.prisma.knowledgeUnit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, title: true, description: true, knowledgeType: true },
    });
    const grants = new Map<string, Date>();
    if (userId) {
      const rows = await this.prisma.userKnowledgeGrant.findMany({
        where: { userId },
        select: { knowledgeUnitId: true, grantedAt: true },
      });
      for (const g of rows) grants.set(g.knowledgeUnitId, g.grantedAt);
    }
    return {
      units: units.map((u) => ({
        id: u.id,
        title: u.title,
        category: u.knowledgeType,
        description: u.description ?? undefined,
        unlocked: grants.has(u.id),
        unlockedAt: grants.get(u.id)?.toISOString(),
      })),
      totalUnlocked: grants.size,
      totalUnits: units.length,
    };
  }

  /**
   * Locked-knowledge view for the AOU "Locked" screen. Unlock requirements
   * are derived from spoiler level (level) and prerequisite dependencies
   * (missions) — the schema has no dedicated gating table.
   */
  async getLockedKnowledge(userId?: string) {
    const units: Array<{
      id: string;
      title: string;
      description: string | null;
      knowledgeType: string;
      spoilerLevel: string;
    }> = await this.prisma.knowledgeUnit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        knowledgeType: true,
        spoilerLevel: true,
      },
    });
    const deps: Array<{ dependentUnitId: string; dependsOnUnitId: string }> =
      await this.prisma.knowledgeDependency.findMany({
        where: { dependencyType: 'prerequisite' },
        select: { dependentUnitId: true, dependsOnUnitId: true },
      });
    const prereqByUnit = new Map<string, string[]>();
    for (const d of deps) {
      const list = prereqByUnit.get(d.dependentUnitId) ?? [];
      list.push(d.dependsOnUnitId);
      prereqByUnit.set(d.dependentUnitId, list);
    }
    const titleById = new Map<string, string>();
    const prereqIds = [...new Set(deps.map((d) => d.dependsOnUnitId))];
    if (prereqIds.length > 0) {
      const rows = await this.prisma.knowledgeUnit.findMany({
        where: { id: { in: prereqIds } },
        select: { id: true, title: true },
      });
      for (const r of rows) titleById.set(r.id, r.title);
    }
    const granted = new Set<string>();
    if (userId) {
      const rows = await this.prisma.userKnowledgeGrant.findMany({
        where: { userId },
        select: { knowledgeUnitId: true },
      });
      for (const g of rows) granted.add(g.knowledgeUnitId);
    }
    return units.map((u) => {
      const prereqs = prereqByUnit.get(u.id) ?? [];
      const firstPrereqTitle = prereqs.length > 0 ? titleById.get(prereqs[0]) : undefined;
      return {
        id: u.id,
        title: u.title,
        description: u.description ?? '',
        category: u.knowledgeType,
        requiredLevel: KnowledgeService.SPOILER_ORDER.indexOf(u.spoilerLevel) + 1,
        requiredMissions: prereqs.length,
        isUnlocked: granted.has(u.id),
        unlockHint:
          prereqs.length > 0 && firstPrereqTitle
            ? `Requires knowing: ${firstPrereqTitle}`
            : 'Unlock by exploring more of the story',
        icon: KnowledgeService.TYPE_ICONS[u.knowledgeType] ?? '📖',
      };
    });
  }
}
