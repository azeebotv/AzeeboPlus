import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Cross-Title Namespace Isolation (AZP-KNOW-010)
//
// Ensures knowledge is properly isolated between different titles/universes:
// - Knowledge from Title A doesn't leak into Title B
// - Cross-title knowledge requires explicit mapping
// - Namespace boundaries are enforced
// ============================================================================

export interface Namespace {
  id: string;
  /** Namespace name (e.g., title slug, universe slug) */
  name: string;
  /** Display name */
  displayName: string;
  /** Parent namespace (for hierarchical isolation) */
  parentNamespaceId?: string;
  /** Whether this is a cross-namespace boundary */
  isCrossNamespaceAllowed: boolean;
  /** Allowed cross-namespace mappings */
  allowedCrossMappings: string[];
}

export interface CrossNamespaceMapping {
  id: string;
  /** Source namespace */
  sourceNamespaceId: string;
  /** Target namespace */
  targetNamespaceId: string;
  /** Knowledge units to map */
  knowledgeUnitIds: string[];
  /** Mapping type */
  mappingType: 'equivalent' | 'prerequisite' | 'supplemental';
  /** Whether this mapping is active */
  isActive: boolean;
}

@Injectable()
export class NamespaceIsolationService {
  private readonly logger = new Logger(NamespaceIsolationService.name);

  // In-memory stores (would be database in production)
  private readonly namespaceStore = new Map<string, Namespace>();
  private readonly mappingStore = new Map<string, CrossNamespaceMapping>();

  /**
   * Create a namespace
   */
  async createNamespace(namespace: Omit<Namespace, 'id'>): Promise<Namespace> {
    const newNamespace: Namespace = {
      ...namespace,
      id: this.generateId(),
    };

    this.namespaceStore.set(newNamespace.id, newNamespace);

    this.logger.log(`Namespace created: ${newNamespace.name} (${newNamespace.id})`);

    return newNamespace;
  }

  /**
   * Get namespace by ID
   */
  async getNamespace(namespaceId: string): Promise<Namespace | undefined> {
    return this.namespaceStore.get(namespaceId);
  }

  /**
   * Get namespace by name
   */
  async getNamespaceByName(name: string): Promise<Namespace | undefined> {
    return Array.from(this.namespaceStore.values()).find((n) => n.name === name);
  }

  /**
   * Check if knowledge can be accessed across namespaces
   */
  canAccessAcrossNamespaces(
    sourceNamespaceId: string,
    targetNamespaceId: string
  ): {
    allowed: boolean;
    reason: string;
  } {
    const source = this.namespaceStore.get(sourceNamespaceId);
    const target = this.namespaceStore.get(targetNamespaceId);

    if (!source || !target) {
      return { allowed: false, reason: 'Namespace not found' };
    }

    // Same namespace always allowed
    if (sourceNamespaceId === targetNamespaceId) {
      return { allowed: true, reason: 'Same namespace' };
    }

    // Check if cross-namespace is allowed
    if (!source.isCrossNamespaceAllowed) {
      return {
        allowed: false,
        reason: `Namespace ${source.name} does not allow cross-namespace access`,
      };
    }

    // Check if target is in allowed mappings
    if (source.allowedCrossMappings.includes(targetNamespaceId)) {
      return { allowed: true, reason: 'Target namespace is in allowed mappings' };
    }

    return {
      allowed: false,
      reason: 'Cross-namespace access not configured',
    };
  }

  /**
   * Create cross-namespace mapping
   */
  async createCrossNamespaceMapping(
    mapping: Omit<CrossNamespaceMapping, 'id'>
  ): Promise<CrossNamespaceMapping> {
    const newMapping: CrossNamespaceMapping = {
      ...mapping,
      id: this.generateId(),
    };

    this.mappingStore.set(newMapping.id, newMapping);

    this.logger.log(
      `Cross-namespace mapping created: ${mapping.sourceNamespaceId} → ${mapping.targetNamespaceId}`
    );

    return newMapping;
  }

  /**
   * Get mappings for a namespace
   */
  async getMappingsForNamespace(namespaceId: string): Promise<CrossNamespaceMapping[]> {
    return Array.from(this.mappingStore.values()).filter(
      (m) =>
        (m.sourceNamespaceId === namespaceId || m.targetNamespaceId === namespaceId) && m.isActive
    );
  }

  /**
   * Get mapped knowledge units
   */
  async getMappedKnowledgeUnits(
    sourceNamespaceId: string,
    targetNamespaceId: string,
    knowledgeUnitIds: string[]
  ): Promise<{
    mapped: Array<{ sourceId: string; targetId: string }>;
    unmapped: string[];
  }> {
    const mapping = Array.from(this.mappingStore.values()).find(
      (m) =>
        m.sourceNamespaceId === sourceNamespaceId &&
        m.targetNamespaceId === targetNamespaceId &&
        m.isActive
    );

    if (!mapping) {
      return { mapped: [], unmapped: knowledgeUnitIds };
    }

    const mapped = knowledgeUnitIds
      .filter((id) => mapping.knowledgeUnitIds.includes(id))
      .map((id) => ({ sourceId: id, targetId: id })); // In production, would have actual target IDs

    const unmapped = knowledgeUnitIds.filter((id) => !mapping.knowledgeUnitIds.includes(id));

    return { mapped, unmapped };
  }

  /**
   * Validate namespace boundary
   */
  validateNamespaceBoundary(
    knowledgeUnitNamespaceId: string,
    accessNamespaceId: string
  ): {
    valid: boolean;
    reason: string;
  } {
    // Same namespace always valid
    if (knowledgeUnitNamespaceId === accessNamespaceId) {
      return { valid: true, reason: 'Same namespace' };
    }

    // Check cross-namespace access
    const accessCheck = this.canAccessAcrossNamespaces(knowledgeUnitNamespaceId, accessNamespaceId);
    if (!accessCheck.allowed) {
      return { valid: false, reason: accessCheck.reason };
    }

    // Check if mapping exists
    const mapping = Array.from(this.mappingStore.values()).find(
      (m) =>
        m.sourceNamespaceId === knowledgeUnitNamespaceId &&
        m.targetNamespaceId === accessNamespaceId &&
        m.isActive
    );

    if (!mapping) {
      return { valid: false, reason: 'No active mapping found' };
    }

    return { valid: true, reason: 'Valid cross-namespace access' };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
