import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Break-Glass Access System — Redis-Backed Implementation (TAA §86)
// ============================================================================

export type BreakGlassReason =
  | 'SEV-1-incident'
  | 'production-outage'
  | 'security-incident'
  | 'data-breach-response'
  | 'emergency-maintenance';

export interface BreakGlassSession {
  id: string;
  userId: string;
  originalRole: string;
  elevatedRole: string;
  reason: BreakGlassReason;
  justification: string;
  activatedAt: Date;
  expiresAt: Date;
  mfaVerified: boolean;
  reAuthenticated: boolean;
  status: 'active' | 'expired' | 'revoked' | 'reviewed';
  reviewedBy?: string;
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
 * Redis-backed break-glass service.
 * Uses Redis for session storage with automatic TTL-based expiry.
 *
 * Key structure:
 * - break_glass:{sessionId} → session data (JSON)
 * - break_glass:sessions → Set of all session IDs
 * - break_glass:user:{userId} → Set of user's session IDs
 */
@Injectable()
export class BreakGlassRedisService {
  private readonly logger = new Logger(BreakGlassRedisService.name);
  private redis: any; // Redis client — injected

  constructor(redisClient?: any) {
    this.redis = redisClient;
  }

  /**
   * Set the Redis client (for dependency injection)
   */
  setRedisClient(client: any): void {
    this.redis = client;
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

    // Check for existing active session (in Redis)
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

    // Store in Redis with TTL = session duration + 1 hour buffer
    const ttlSeconds = Math.ceil((MAX_DURATION_MS + 60 * 60 * 1000) / 1000);
    await this.redis.setex(`${KEY_PREFIX}${session.id}`, ttlSeconds, JSON.stringify(session));

    // Add to indexes
    await this.redis.sadd(SESSION_INDEX_KEY, session.id);
    await this.redis.sadd(`${USER_SESSIONS_PREFIX}${request.userId}`, session.id);

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
    const data = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
    if (!data) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    const session = JSON.parse(data) as BreakGlassSession;

    if (session.status !== 'active') {
      throw new UnauthorizedException(`Break-glass session is ${session.status}`);
    }

    if (new Date() > new Date(session.expiresAt)) {
      session.status = 'expired';
      await this.redis.set(`${KEY_PREFIX}${sessionId}`, JSON.stringify(session));
      this.logger.warn(`BREAK-GLASS EXPIRED: Session ${sessionId} for user ${session.userId}`);
      throw new UnauthorizedException('Break-glass session has expired');
    }

    return session;
  }

  /**
   * Revoke a break-glass session
   */
  async revoke(sessionId: string, revokedBy: string): Promise<BreakGlassSession> {
    const data = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
    if (!data) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    const session = JSON.parse(data) as BreakGlassSession;
    session.status = 'revoked';
    session.reviewedBy = revokedBy;

    await this.redis.set(`${KEY_PREFIX}${sessionId}`, JSON.stringify(session));

    this.logger.warn(
      `BREAK-GLASS REVOKED: Session ${sessionId} for user ${session.userId} revoked by ${revokedBy}`
    );

    return session;
  }

  /**
   * Review a break-glass session (mandatory by next business day)
   */
  async review(sessionId: string, reviewedBy: string, notes: string): Promise<BreakGlassSession> {
    const data = await this.redis.get(`${KEY_PREFIX}${sessionId}`);
    if (!data) {
      throw new UnauthorizedException('Break-glass session not found');
    }

    const session = JSON.parse(data) as BreakGlassSession;
    session.status = 'reviewed';
    session.reviewedBy = reviewedBy;
    session.reviewNotes = notes;

    await this.redis.set(`${KEY_PREFIX}${sessionId}`, JSON.stringify(session));

    this.logger.log(`BREAK-GLASS REVIEWED: Session ${sessionId} reviewed by ${reviewedBy}`);

    return session;
  }

  /**
   * Get all active sessions (for security monitoring)
   */
  async getActiveSessions(): Promise<BreakGlassSession[]> {
    const sessionIds = await this.redis.smembers(SESSION_INDEX_KEY);
    const activeSessions: BreakGlassSession[] = [];

    for (const sid of sessionIds) {
      const data = await this.redis.get(`${KEY_PREFIX}${sid}`);
      if (!data) continue;

      const session = JSON.parse(data) as BreakGlassSession;

      // Auto-expire old sessions
      if (session.status === 'active' && new Date() > new Date(session.expiresAt)) {
        session.status = 'expired';
        await this.redis.set(`${KEY_PREFIX}${sid}`, JSON.stringify(session));
      }

      if (session.status === 'active') {
        activeSessions.push(session);
      }
    }

    return activeSessions;
  }

  /**
   * Get all sessions for audit (including expired/revoked)
   */
  async getAllSessions(): Promise<BreakGlassSession[]> {
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

  /**
   * Clean up expired sessions (can be called periodically)
   */
  async cleanupExpired(): Promise<number> {
    const sessionIds = await this.redis.smembers(SESSION_INDEX_KEY);
    let cleaned = 0;

    for (const sid of sessionIds) {
      const data = await this.redis.get(`${KEY_PREFIX}${sid}`);
      if (!data) {
        // Key expired, remove from index
        await this.redis.srem(SESSION_INDEX_KEY, sid);
        cleaned++;
        continue;
      }

      const session = JSON.parse(data) as BreakGlassSession;
      if (new Date() > new Date(session.expiresAt) && session.status === 'active') {
        session.status = 'expired';
        await this.redis.set(`${KEY_PREFIX}${sid}`, JSON.stringify(session));
        cleaned++;
      }
    }

    return cleaned;
  }
}
