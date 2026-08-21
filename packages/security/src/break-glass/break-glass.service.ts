import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Break-Glass Access System (TAA §86)
// ============================================================================

export type BreakGlassReason =
  | 'SEV-1-incident'
  | 'production-outage'
  | 'security-incident'
  | 'data-breach-response'
  | 'emergency-maintenance';

export interface BreakGlassSession {
  id: string;
  /** User requesting elevation */
  userId: string;
  /** Original role before elevation */
  originalRole: string;
  /** Elevated role granted */
  elevatedRole: string;
  /** Reason for elevation (must be SEV-1/emergency) */
  reason: BreakGlassReason;
  /** Justification text */
  justification: string;
  /** When the session was activated */
  activatedAt: Date;
  /** When the session expires (max 60 minutes) */
  expiresAt: Date;
  /** Whether MFA was verified */
  mfaVerified: boolean;
  /** Whether re-authentication was performed */
  reAuthenticated: boolean;
  /** Status of the session */
  status: 'active' | 'expired' | 'revoked' | 'reviewed';
  /** Who revoked/reviewed the session */
  reviewedBy?: string;
  /** Review notes */
  reviewNotes?: string;
}

export interface BreakGlassActivationRequest {
  userId: string;
  originalRole: string;
  elevatedRole: string;
  reason: BreakGlassReason;
  justification: string;
  mfaVerified: boolean;
  reAuthenticated: boolean;
}

/**
 * In-memory store for break-glass sessions.
 * In production, persist to database with restricted write access.
 */
const breakGlassSessions = new Map<string, BreakGlassSession>();

const MAX_DURATION_MS = 60 * 60 * 1000; // 60 minutes

@Injectable()
export class BreakGlassService {
  private readonly logger = new Logger(BreakGlassService.name);

  /**
   * Clear the in-memory store (for testing only)
   */
  static clearStore(): void {
    breakGlassSessions.clear();
  }

  /**
   * Activate a break-glass session (TAA §86)
   */
  async activate(request: BreakGlassActivationRequest): Promise<BreakGlassSession> {
    // Validate MFA and re-authentication
    if (!request.mfaVerified) {
      throw new ForbiddenException('Break-glass requires MFA verification');
    }
    if (!request.reAuthenticated) {
      throw new ForbiddenException('Break-glass requires re-authentication');
    }

    // Validate reason is emergency-level
    const emergencyReasons: BreakGlassReason[] = [
      'SEV-1-incident',
      'production-outage',
      'security-incident',
      'data-breach-response',
      'emergency-maintenance',
    ];
    if (!emergencyReasons.includes(request.reason)) {
      throw new ForbiddenException(
        'Break-glass reason must be a SEV-1/emergency incident',
      );
    }

    // Check for existing active session
    for (const session of breakGlassSessions.values()) {
      if (session.userId === request.userId && session.status === 'active') {
        throw new ForbiddenException(
          'User already has an active break-glass session',
        );
      }
    }

    const now = new Date();
    const session: BreakGlassSession = {
      id: randomUUID(),
      userId: request.userId,
      originalRole: request.originalRole,
      elevatedRole: request.elevatedRole,
      reason: request.reason,
      justification: request.justification,
      activatedAt: now,
      expiresAt: new Date(now.getTime() + MAX_DURATION_MS),
      mfaVerified: request.mfaVerified,
      reAuthenticated: request.reAuthenticated,
      status: 'active',
    };

    breakGlassSessions.set(session.id, session);

    this.logger.warn(
      `BREAK-GLASS ACTIVATED: User ${request.userId} elevated from ${request.originalRole} to ${request.elevatedRole} ` +
        `for ${request.reason}. Session ${session.id} expires at ${session.expiresAt.toISOString()}`,
    );

    return session;
  }

  /**
   * Validate a break-glass session is still active
   */
  async validate(sessionId: string): Promise<BreakGlassSession> {
    const session = breakGlassSessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    if (session.status !== 'active') {
      throw new UnauthorizedException(`Break-glass session is ${session.status}`);
    }

    if (new Date() > session.expiresAt) {
      session.status = 'expired';
      this.logger.warn(`BREAK-GLASS EXPIRED: Session ${sessionId} for user ${session.userId}`);
      throw new UnauthorizedException('Break-glass session has expired');
    }

    return session;
  }

  /**
   * Revoke a break-glass session
   */
  async revoke(sessionId: string, revokedBy: string): Promise<BreakGlassSession> {
    const session = breakGlassSessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    session.status = 'revoked';
    session.reviewedBy = revokedBy;

    this.logger.warn(
      `BREAK-GLASS REVOKED: Session ${sessionId} for user ${session.userId} revoked by ${revokedBy}`,
    );

    return session;
  }

  /**
   * Review a break-glass session (mandatory by next business day)
   */
  async review(
    sessionId: string,
    reviewedBy: string,
    notes: string,
  ): Promise<BreakGlassSession> {
    const session = breakGlassSessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    session.status = 'reviewed';
    session.reviewedBy = reviewedBy;
    session.reviewNotes = notes;

    this.logger.log(
      `BREAK-GLASS REVIEWED: Session ${sessionId} reviewed by ${reviewedBy}`,
    );

    return session;
  }

  /**
   * Get all active sessions (for security monitoring)
   */
  async getActiveSessions(): Promise<BreakGlassSession[]> {
    // Auto-expire old sessions
    for (const session of breakGlassSessions.values()) {
      if (session.status === 'active' && new Date() > session.expiresAt) {
        session.status = 'expired';
      }
    }

    return Array.from(breakGlassSessions.values()).filter(
      (s) => s.status === 'active',
    );
  }

  /**
   * Get all sessions for audit (including expired/revoked)
   */
  async getAllSessions(): Promise<BreakGlassSession[]> {
    return Array.from(breakGlassSessions.values());
  }
}
