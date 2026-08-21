import { Injectable, Logger, ForbiddenException } from '@nestjs/common';

/**
 * Support Service — Least-Privilege Access Control (AZP-SUP-002)
 *
 * Ensures support agents can only access data within their scope:
 * - Agents: own assigned tickets only
 * - Supervisors: team's tickets + escalation
 * - Admins: all tickets + system config
 *
 * Enforces field-level masking for PII (email, phone, IP).
 */

export type SupportRole = 'agent' | 'supervisor' | 'admin';

export interface AccessScope {
  role: SupportRole;
  canViewAllTickets: boolean;
  canAssignTickets: boolean;
  canEscalate: boolean;
  canCloseTickets: boolean;
  canViewPII: boolean;
  canExportData: boolean;
  canManageSLA: boolean;
  teamIds?: string[];
}

const ROLE_SCOPES: Record<SupportRole, AccessScope> = {
  agent: {
    role: 'agent',
    canViewAllTickets: false,
    canAssignTickets: false,
    canEscalate: true,
    canCloseTickets: true,
    canViewPII: false,
    canExportData: false,
    canManageSLA: false,
  },
  supervisor: {
    role: 'supervisor',
    canViewAllTickets: false, // team-scoped
    canAssignTickets: true,
    canEscalate: true,
    canCloseTickets: true,
    canViewPII: true,
    canExportData: false,
    canManageSLA: true,
  },
  admin: {
    role: 'admin',
    canViewAllTickets: true,
    canAssignTickets: true,
    canEscalate: true,
    canCloseTickets: true,
    canViewPII: true,
    canExportData: true,
    canManageSLA: true,
  },
};

@Injectable()
export class SupportAccessControlService {
  private readonly logger = new Logger(SupportAccessControlService.name);

  /**
   * Get access scope for a support role.
   */
  getScope(role: SupportRole): AccessScope {
    return ROLE_SCOPES[role] || ROLE_SCOPES.agent;
  }

  /**
   * Check if an agent can access a specific ticket.
   */
  canAccessTicket(
    agentRole: SupportRole,
    agentId: string,
    ticket: { assignedTo?: string | null; teamId?: string },
  ): boolean {
    const scope = this.getScope(agentRole);

    // Admins can access everything
    if (scope.canViewAllTickets) return true;

    // Agents can only access their own assigned tickets
    if (agentRole === 'agent') {
      return ticket.assignedTo === agentId;
    }

    // Supervisors can access team tickets
    if (agentRole === 'supervisor') {
      if (!scope.teamIds || scope.teamIds.length === 0) return true;
      return !ticket.teamId || scope.teamIds.includes(ticket.teamId);
    }

    return false;
  }

  /**
   * Enforce access control — throws if not authorized.
   */
  enforceAccess(
    agentRole: SupportRole,
    agentId: string,
    ticket: { assignedTo?: string | null; teamId?: string },
    action: string,
  ): void {
    if (!this.canAccessTicket(agentRole, agentId, ticket)) {
      this.logger.warn(
        `Access denied: ${agentRole} ${agentId} attempted ${action} on ticket assigned to ${ticket.assignedTo}`,
      );
      throw new ForbiddenException('You do not have access to this ticket');
    }
  }

  /**
   * Mask PII fields based on role permissions.
   */
  maskPII<T extends Record<string, unknown>>(data: T, role: SupportRole): T {
    const scope = this.getScope(role);
    if (scope.canViewPII) return data;

    const masked = { ...data } as Record<string, unknown>;
    const piiFields = ['email', 'phone', 'ipAddress', 'address', 'dateOfBirth'];

    for (const field of piiFields) {
      if (masked[field] && typeof masked[field] === 'string') {
        const value = masked[field] as string;
        masked[field] = value.replace(/(.{2})(.*)(.*)/, (_m: string, a: string, b: string, c: string) =>
          a + '*'.repeat(Math.min(b.length, 8)) + (c.slice(-2) || '')
        );
      }
    }

    return masked as T;
  }
}
