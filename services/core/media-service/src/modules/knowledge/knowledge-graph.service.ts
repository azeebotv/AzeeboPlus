import { Injectable } from '@nestjs/common';

/**
 * Canonical Knowledge Graph Service (TAA §16-20, §77)
 *
 * Manages the knowledge graph for storyworld content:
 * - Canonical events
 * - Knowledge units
 * - Knowledge dependencies
 * - Content checkpoints
 * - Checkpoint grants
 * - Equivalence sets
 * - User knowledge grants
 * - Knowledge projections
 */

// ---------------------------------------------------------------------------
// Data Models
// ---------------------------------------------------------------------------

export interface CanonicalEvent {
  id: string;
  /** Storyworld/universe ID */
  universeId: string;
  /** Event title */
  title: string;
  /** Event description */
  description: string;
  /** Spoiler level */
  spoilerLevel: 'none' | 'mild' | 'moderate' | 'heavy';
  /** Prerequisite event IDs */
  prerequisiteIds: string[];
  /** Created at */
  createdAt: Date;
}

export interface KnowledgeUnit {
  id: string;
  /** Associated canonical event */
  eventId: string;
  /** Knowledge title */
  title: string;
  /** Knowledge description */
  description: string;
  /** Spoiler level */
  spoilerLevel: 'none' | 'mild' | 'moderate' | 'heavy';
  /** Tags for grouping */
  tags: string[];
  /** Created at */
  createdAt: Date;
}

export interface KnowledgeDependency {
  id: string;
  /** Knowledge unit that depends on another */
  dependentId: string;
  /** Knowledge unit that is a prerequisite */
  prerequisiteId: string;
  /** Dependency type */
  type: 'requires' | 'enhances' | 'contradicts';
}

export interface ContentCheckpoint {
  id: string;
  /** Content ID */
  contentId: string;
  /** Checkpoint title */
  title: string;
  /** Timestamp in content (seconds) */
  timestampSeconds: number;
  /** Description */
  description: string;
  /** Knowledge units granted by this checkpoint */
  grantedKnowledgeUnitIds: string[];
  /** Created at */
  createdAt: Date;
}

export interface CheckpointGrant {
  id: string;
  /** Checkpoint ID */
  checkpointId: string;
  /** Knowledge unit ID */
  knowledgeUnitId: string;
  /** Grant conditions */
  conditions?: GrantCondition[];
}

export interface GrantCondition {
  /** Condition type */
  type: 'consumption' | 'time' | 'achievement';
  /** Condition value */
  value: number;
  /** Condition unit */
  unit: string;
}

export interface EquivalenceSet {
  id: string;
  /** Set name */
  title: string;
  /** Knowledge units that are equivalent */
  knowledgeUnitIds: string[];
  /** Mapping type */
  mappingType: 'format' | 'perspective' | 'timeline';
  /** Created at */
  createdAt: Date;
}

export interface UserKnowledgeGrant {
  id: string;
  /** User ID */
  userId: string;
  /** Knowledge unit ID */
  knowledgeUnitId: string;
  /** When knowledge was granted */
  grantedAt: Date;
  /** Checkpoint that granted this knowledge */
  checkpointId: string;
  /** Content that granted this knowledge */
  contentId: string;
  /** Sequence number for ordering */
  sequenceNumber: number;
}

export interface KnowledgeProjection {
  userId: string;
  /** Set of known knowledge unit IDs */
  knownUnitIds: Set<string>;
  /** Version of the projection */
  version: number;
  /** Last updated */
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class KnowledgeGraphService {


  /** In-memory stores (would be database in production) */
  private readonly events = new Map<string, CanonicalEvent>();
  private readonly units = new Map<string, KnowledgeUnit>();
  private readonly dependencies = new Map<string, KnowledgeDependency>();
  private readonly checkpoints = new Map<string, ContentCheckpoint>();
  private readonly grants = new Map<string, CheckpointGrant>();
  private readonly equivalenceSets = new Map<string, EquivalenceSet>();
  private readonly userGrants = new Map<string, UserKnowledgeGrant[]>();
  private readonly projections = new Map<string, KnowledgeProjection>();

  // --- Canonical Events ---

  async createEvent(event: Omit<CanonicalEvent, 'id' | 'createdAt'>): Promise<CanonicalEvent> {
    const newEvent: CanonicalEvent = {
      ...event,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async getEvent(id: string): Promise<CanonicalEvent | undefined> {
    return this.events.get(id);
  }

  async getEventsForUniverse(universeId: string): Promise<CanonicalEvent[]> {
    return Array.from(this.events.values()).filter((e) => e.universeId === universeId);
  }

  // --- Knowledge Units ---

  async createKnowledgeUnit(unit: Omit<KnowledgeUnit, 'id' | 'createdAt'>): Promise<KnowledgeUnit> {
    const newUnit: KnowledgeUnit = {
      ...unit,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.units.set(newUnit.id, newUnit);
    return newUnit;
  }

  async getKnowledgeUnit(id: string): Promise<KnowledgeUnit | undefined> {
    return this.units.get(id);
  }

  async getUnitsForEvent(eventId: string): Promise<KnowledgeUnit[]> {
    return Array.from(this.units.values()).filter((u) => u.eventId === eventId);
  }

  // --- Knowledge Dependencies ---

  async addDependency(dep: Omit<KnowledgeDependency, 'id'>): Promise<KnowledgeDependency> {
    const newDep: KnowledgeDependency = {
      ...dep,
      id: this.generateId(),
    };
    this.dependencies.set(newDep.id, newDep);
    return newDep;
  }

  async getDependencies(unitId: string): Promise<KnowledgeDependency[]> {
    return Array.from(this.dependencies.values()).filter((d) => d.dependentId === unitId);
  }

  async getPrerequisites(unitId: string): Promise<KnowledgeUnit[]> {
    const deps = await this.getDependencies(unitId);
    const prereqs: KnowledgeUnit[] = [];
    for (const dep of deps) {
      const unit = this.units.get(dep.prerequisiteId);
      if (unit) prereqs.push(unit);
    }
    return prereqs;
  }

  // --- Content Checkpoints ---

  async createCheckpoint(
    checkpoint: Omit<ContentCheckpoint, 'id' | 'createdAt'>
  ): Promise<ContentCheckpoint> {
    const newCheckpoint: ContentCheckpoint = {
      ...checkpoint,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.checkpoints.set(newCheckpoint.id, newCheckpoint);
    return newCheckpoint;
  }

  async getCheckpointsForContent(contentId: string): Promise<ContentCheckpoint[]> {
    return Array.from(this.checkpoints.values())
      .filter((c) => c.contentId === contentId)
      .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  }

  async getCheckpointAtTime(
    contentId: string,
    timestampSeconds: number
  ): Promise<ContentCheckpoint | undefined> {
    const checkpoints = await this.getCheckpointsForContent(contentId);
    return checkpoints.find((c) => c.timestampSeconds <= timestampSeconds);
  }

  // --- Checkpoint Grants ---

  async addCheckpointGrant(grant: Omit<CheckpointGrant, 'id'>): Promise<CheckpointGrant> {
    const newGrant: CheckpointGrant = {
      ...grant,
      id: this.generateId(),
    };
    this.grants.set(newGrant.id, newGrant);
    return newGrant;
  }

  async getGrantsForCheckpoint(checkpointId: string): Promise<CheckpointGrant[]> {
    return Array.from(this.grants.values()).filter((g) => g.checkpointId === checkpointId);
  }

  // --- Equivalence Sets ---

  async createEquivalenceSet(
    set: Omit<EquivalenceSet, 'id' | 'createdAt'>
  ): Promise<EquivalenceSet> {
    const newSet: EquivalenceSet = {
      ...set,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.equivalenceSets.set(newSet.id, newSet);
    return newSet;
  }

  async getEquivalenceSet(id: string): Promise<EquivalenceSet | undefined> {
    return this.equivalenceSets.get(id);
  }

  async getEquivalentUnits(unitId: string): Promise<KnowledgeUnit[]> {
    const set = Array.from(this.equivalenceSets.values()).find((s) =>
      s.knowledgeUnitIds.includes(unitId)
    );
    if (!set) return [];

    return set.knowledgeUnitIds
      .filter((id) => id !== unitId)
      .map((id) => this.units.get(id))
      .filter((u): u is KnowledgeUnit => u !== undefined);
  }

  // --- User Knowledge Grants ---

  async grantKnowledge(
    userId: string,
    checkpointId: string,
    contentId: string
  ): Promise<UserKnowledgeGrant[]> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return [];

    const newGrants: UserKnowledgeGrant[] = [];
    const existingGrants = this.userGrants.get(userId) || [];
    const existingUnitIds = new Set(existingGrants.map((g) => g.knowledgeUnitId));

    for (const unitId of checkpoint.grantedKnowledgeUnitIds) {
      if (existingUnitIds.has(unitId)) continue; // Idempotent

      const grant: UserKnowledgeGrant = {
        id: this.generateId(),
        userId,
        knowledgeUnitId: unitId,
        grantedAt: new Date(),
        checkpointId,
        contentId,
        sequenceNumber: existingGrants.length + newGrants.length + 1,
      };

      newGrants.push(grant);
    }

    if (newGrants.length > 0) {
      this.userGrants.set(userId, [...existingGrants, ...newGrants]);
      this.invalidateProjection(userId);
    }

    return newGrants;
  }

  async getUserGrants(userId: string): Promise<UserKnowledgeGrant[]> {
    return this.userGrants.get(userId) || [];
  }

  // --- Knowledge Projections ---

  async getProjection(userId: string): Promise<KnowledgeProjection> {
    const existing = this.projections.get(userId);
    if (existing) return existing;

    // Build projection from grants
    const grants = await this.getUserGrants(userId);
    const knownUnitIds = new Set(grants.map((g) => g.knowledgeUnitId));

    // Also include equivalent units
    for (const unitId of knownUnitIds) {
      const equivalents = await this.getEquivalentUnits(unitId);
      for (const eq of equivalents) {
        knownUnitIds.add(eq.id);
      }
    }

    const projection: KnowledgeProjection = {
      userId,
      knownUnitIds,
      version: grants.length,
      updatedAt: new Date(),
    };

    this.projections.set(userId, projection);
    return projection;
  }

  private invalidateProjection(userId: string): void {
    this.projections.delete(userId);
  }

  // --- Utility ---

  private generateId(): string {
    return `kg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get knowledge graph statistics
   */
  async getStats(): Promise<{
    totalEvents: number;
    totalUnits: number;
    totalCheckpoints: number;
    totalUserGrants: number;
  }> {
    return {
      totalEvents: this.events.size,
      totalUnits: this.units.size,
      totalCheckpoints: this.checkpoints.size,
      totalUserGrants: Array.from(this.userGrants.values()).reduce(
        (sum, grants) => sum + grants.length,
        0
      ),
    };
  }
}
