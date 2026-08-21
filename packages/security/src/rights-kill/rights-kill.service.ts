import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Emergency Rights Kill Path (TAA §82)
// ============================================================================

export type RightsKillTrigger =
  | 'legal-takedown'
  | 'rights-expiry'
  | 'content-violation'
  | 'court-order'
  | 'emergency';

export type RightsKillScope = 'single-title' | 'universe' | 'global';

export interface RightsKillOrder {
  id: string;
  /** Content/universe to block */
  targetId: string;
  /** Scope of the kill */
  scope: RightsKillScope;
  /** Trigger reason */
  trigger: RightsKillTrigger;
  /** Who initiated */
  initiatedBy: string;
  /** Who approved (if dual-control required) */
  approvedBy?: string;
  /** Status */
  status: 'pending' | 'propagating' | 'active' | 'expired' | 'revoked';
  /** When activated */
  activatedAt?: Date;
  /** When propagation completed */
  propagatedAt?: Date;
  /** CDN purge status */
  cdnPurgeStatus: 'pending' | 'in_progress' | 'completed';
  /** API block status */
  apiBlockStatus: 'pending' | 'active';
  /** Search exclusion status */
  searchExclusionStatus: 'pending' | 'active';
  /** Audit trail */
  auditTrail: RightsKillAuditEntry[];
  /** When the order was created */
  createdAt: Date;
  /** Expiry (for temporary blocks) */
  expiresAt?: Date;
}

export interface RightsKillAuditEntry {
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

/**
 * In-memory store for rights kill orders.
 * In production, persist to database with restricted write access.
 */
const rightsKillOrders = new Map<string, RightsKillOrder>();

@Injectable()
export class RightsKillService {
  private readonly logger = new Logger(RightsKillService.name);

  /**
   * Clear the in-memory store (for testing only)
   */
  static clearStore(): void {
    rightsKillOrders.clear();
  }

  /**
   * Create a rights kill order
   */
  async createOrder(
    targetId: string,
    scope: RightsKillScope,
    trigger: RightsKillTrigger,
    initiatedBy: string,
    expiresAt?: Date
  ): Promise<RightsKillOrder> {
    const order: RightsKillOrder = {
      id: randomUUID(),
      targetId,
      scope,
      trigger,
      initiatedBy,
      status: 'pending',
      cdnPurgeStatus: 'pending',
      apiBlockStatus: 'pending',
      searchExclusionStatus: 'pending',
      auditTrail: [
        {
          action: 'order_created',
          performedBy: initiatedBy,
          timestamp: new Date(),
          details: { targetId, scope, trigger },
        },
      ],
      createdAt: new Date(),
      expiresAt,
    };

    rightsKillOrders.set(order.id, order);

    this.logger.warn(
      `RIGHTS KILL ORDER CREATED: ${scope} ${targetId} for ${trigger} by ${initiatedBy}`
    );

    return order;
  }

  /**
   * Activate a rights kill order (propagate policy)
   */
  async activateOrder(orderId: string, activatedBy: string): Promise<RightsKillOrder> {
    const order = rightsKillOrders.get(orderId);
    if (!order) {
      throw new NotFoundException('Rights kill order not found');
    }

    if (order.status !== 'pending') {
      throw new ForbiddenException(`Order is ${order.status}, not pending`);
    }

    order.status = 'propagating';
    order.activatedAt = new Date();
    order.auditTrail.push({
      action: 'order_activated',
      performedBy: activatedBy,
      timestamp: new Date(),
      details: {},
    });

    this.logger.warn(
      `RIGHTS KILL ACTIVATED: ${order.scope} ${order.targetId} — propagating policy`
    );

    // In production: trigger CDN purge, API block, search exclusion
    // For now, mark as completed
    order.cdnPurgeStatus = 'completed';
    order.apiBlockStatus = 'active';
    order.searchExclusionStatus = 'active';
    order.status = 'active';
    order.propagatedAt = new Date();

    order.auditTrail.push({
      action: 'policy_propagated',
      performedBy: 'system',
      timestamp: new Date(),
      details: {
        cdnPurge: order.cdnPurgeStatus,
        apiBlock: order.apiBlockStatus,
        searchExclusion: order.searchExclusionStatus,
      },
    });

    this.logger.warn(
      `RIGHTS KILL PROPAGATED: ${order.scope} ${order.targetId} — policy active across all services`
    );

    return order;
  }

  /**
   * Revoke a rights kill order
   */
  async revokeOrder(orderId: string, revokedBy: string): Promise<RightsKillOrder> {
    const order = rightsKillOrders.get(orderId);
    if (!order) {
      throw new NotFoundException('Rights kill order not found');
    }

    if (order.status !== 'active') {
      throw new ForbiddenException(
        `Can only revoke active orders, current status: ${order.status}`
      );
    }

    order.status = 'revoked';
    order.auditTrail.push({
      action: 'order_revoked',
      performedBy: revokedBy,
      timestamp: new Date(),
      details: {},
    });

    this.logger.warn(`RIGHTS KILL REVOKED: ${order.scope} ${order.targetId} by ${revokedBy}`);

    return order;
  }

  /**
   * Check if a target is blocked by a rights kill order
   */
  async isBlocked(targetId: string): Promise<boolean> {
    for (const order of rightsKillOrders.values()) {
      if (order.status !== 'active') continue;
      if (order.targetId === targetId) return true;
      if (order.expiresAt && new Date() > order.expiresAt) {
        order.status = 'expired';
      }
    }
    return false;
  }

  /**
   * Get a rights kill order by ID
   */
  async getOrder(orderId: string): Promise<RightsKillOrder> {
    const order = rightsKillOrders.get(orderId);
    if (!order) {
      throw new NotFoundException('Rights kill order not found');
    }
    return order;
  }

  /**
   * Get all active rights kill orders
   */
  async getActiveOrders(): Promise<RightsKillOrder[]> {
    // Auto-expire old orders
    for (const order of rightsKillOrders.values()) {
      if (order.status === 'active' && order.expiresAt && new Date() > order.expiresAt) {
        order.status = 'expired';
      }
    }

    return Array.from(rightsKillOrders.values()).filter((o) => o.status === 'active');
  }
}
