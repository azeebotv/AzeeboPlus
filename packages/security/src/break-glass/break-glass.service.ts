import { Injectable, Logger, UnauthorizedException, ForbiddenException, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Break-Glass Access System (TAA §86)
//
// Production mode: Uses Redis for session storage with automatic TTL-based expiry
// Test mode: Falls back to in-memory Map when no Redis client is provided
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

const MAX_DURATION_MS = 60 * 60 * 1000; // 60 minutes
const KEY_PREFIX = 'break_glass:';
const SESSION_INDEX_KEY = 'break_glass:sessions';
const USER_SESSIONS_PREFIX = 'break_glass:user:';

/**
 * Break-glass service with Redis persistence (production) or in-memory fallback (testing).
 */
@Injectable()
export class BreakGlassService {
  private readonly logger = new Logger(BreakGlassService.name);
  private redis: any; // Redis client — optional injection

  // In-memory fallback (used when no Redis)
  private static inMemorySessions = new Map<string, BreakGlassSession>();

  constructor(@Optional() redisClient?: any) {
    this.redis = redisClient;
  }

  /**
   * Set the Redis client (for dependency injection)
   */
  setRedisClient(client: any): void {
    this.redis = client;
  }

  /**
   * Check if running in production mode (Redis)
   */
  private get isProduction(): boolean {
    return !!this.redis;
  }

  /**
   * Clear the in-memory store (for testing only)
   */
  static clearStore(): void {
    BreakGlassService.inMemorySessions.clear();
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
      throw new ForbiddenException('Break-glass reason must be a SEV-1/emergency incident');
    }

    // Check for existing active session
    if (this.isProduction) {
      const userSessionIds = await this.redis.smembers(`${USER_SESSIONS_PREFIX}${request.userId}`);
      for (const sid of userSessionIds) {
        const existing = await this.redis.get(`${KEY_PREFIX}${sid}`);
        if (existing) {
          const session = JSON.parse(existing) as BreakGlassSession;
          if (session.status === 'active') {
            throw new ForbiddenException('User already has an active break-glass session');
          }
        }
      }
    } else {
      for (const session of BreakGlassService.inMemorySessions.values()) {
        if (session.userId === request.userId && session.status === 'active') {
          throw new ForbiddenException('User already has an active break-glass session');
        }
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

    if (this.isProduction) {
      // Store in Redis with TTL = session duration + 1 hour buffer
      const ttlSeconds = Math.ceil((MAX_DURATION_MS + 60 * 60 * 1000) / 1000);
      await this.redis.setex(`${KEY_PREFIX}${session.id}`, ttlSeconds, JSON.stringify(session));
      await this.redis.sadd(SESSION_INDEX_KEY, session.id);
      await this.redis.sadd(`${USER_SESSIONS_PREFIX}${request.userId}`, session.id);
    } else {
      BreakGlassService.inMemorySessions.set(session.id, session);
    }

    this.logger.warn(
      `BREAK-GLASS ACTIVATED: User ${request.userId} elevated from ${request.originalRole} to ${request.elevatedRole} ` +
        `for ${request.reason}. Session ${session.id} expires at ${session.expiresAt.toISOString()}`
    );

    return session;
  }

  /**
   * Validate a break-glass session is still active
   */
  async validate(sessionId: string): Promise<BreakGlassSession> {
    let session: BreakGlassSession | null = null;

    if (this.isProduction) {
      const data = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
      if (data) {
        session = JSON.parse(data) as BreakGlassSession;
      }
    } else {
      const found = BreakGlassService.inMemorySessions.get(sessionId);
      if (found) {
        session = found;
      }
    }

    if (!session) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    if (session.status !== 'active') {
      throw new UnauthorizedException(`Break-glass session is ${session.status}`);
    }

    if (new Date() > session.expiresAt) {
      session.status = 'expired';
      if (this.isProduction) {
        await this.redis.set(`${KEY_PREFIX}${sessionId}`, JSON.stringify(session));
      }
      this.logger.warn(`BREAK-GLASS EXPIRED: Session ${sessionId} for user ${session.userId}`);
      throw new UnauthorizedException('Break-glass session has expired');
    }

    return session;
  }

  /**
   * Revoke a break-glass session
   */
  async revoke(sessionId: string, revokedBy: string): Promise<BreakGlassSession> {
    let session: BreakGlassSession | null = null;

    if (this.isProduction) {
      const data = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
      if (data) {
        session = JSON.parse(data) as BreakGlassSession;
      }
    } else {
      const found = BreakGlassService.inMemorySessions.get(sessionId);
      if (found) {
        session = found;
      }
    }

    if (!session) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    session.status = 'revoked';
    session.reviewedBy = revokedBy;

    if (this.isProduction) {
      await this.redis.set(`${KEY_PREFIX}${sessionId}`, JSON.stringify(session));
    }

    this.logger.warn(
      `BREAK-GLASS REVOKED: Session ${sessionId} for user ${session.userId} revoked by ${revokedBy}`
    );

    return session;
  }

  /**
   * Review a break-glass session (mandatory by next business day)
   */
  async review(sessionId: string, reviewedBy: string, notes: string): Promise<BreakGlassSession> {
    let session: BreakGlassSession | null = null;

    if (this.isProduction) {
      const data = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
      if (data) {
        session = JSON.parse(data) as BreakGlassSession;
      }
    } else {
      const found = BreakGlassService.inMemorySessions.get(sessionId);
      if (found) {
        session = found;
      }
    }

    if (!session) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    session.status = 'reviewed';
    session.reviewedBy = reviewedBy;
    session.reviewNotes = notes;

    if (this.isProduction) {
      await this.redis.set(`${KEY_PREFIX}${sessionId}`, JSON.stringify(session));
    }

    this.logger.log(`BREAK-GLASS REVIEWED: Session ${sessionId} reviewed by ${reviewedBy}`);

    return session;
  }

  /**
   * Get all active sessions (for security monitoring)
   */
  async getActiveSessions(): Promise<BreakGlassSession[]> {
    if (this.isProduction) {
      const sessionIds = await this.redis.smembers(SESSION_INDEX_KEY);
      const activeSessions: BreakGlassSession[] = [];

      for (const sid of sessionIds) {
        const data = await this.redis.get(`${KEY_PREFIX}${sid}`);
        if (!data) continue;

        const session = JSON.parse(data) as BreakGlassSession;

        // Auto-expire old sessions
        if (session.status === 'active' && new Date() > session.expiresAt) {
          session.status = 'expired';
          await this.redis.set(`${KEY_PREFIX}${sid}`, JSON.stringify(session));
        }

        if (session.status === 'active') {
          activeSessions.push(session);
        }
      }

      return activeSessions;
    }

    // In-memory fallback
    for (const session of BreakGlassService.inMemorySessions.values()) {
      if (session.status === 'active' && new Date() > session.expiresAt) {
        session.status = 'expired';
      }
    }

    return Array.from(BreakGlassService.inMemorySessions.values()).filter((s) => s.status === 'active');
  }

  /**
   * Get all sessions for audit (including expired/revoked)
   */
  async getAllSessions(): Promise<BreakGlassSession[]> {
    if (this.isProduction) {
      const sessionIds = await this.redis.smembers(SESSION_INDEX_KEY);
      const sessions: BreakGlassSession[] = [];

      for (const sid of sessionIds) {
        const data = await this.redis.get(`${KEY_PREFIX}${sid}`);
        if (data) {
          sessions.push(JSON.parse(data) as BreakGlassSession);
        }
      }

      return sessions;
    }

    return Array.from(BreakGlassService.inMemorySessions.values());
  }
}
