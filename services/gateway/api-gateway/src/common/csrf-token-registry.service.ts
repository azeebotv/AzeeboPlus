import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type Redis from 'ioredis';

/**
 * CSRF token registry (SEC-005 hardening).
 *
 * The gateway's CSRF middleware implements the double-submit cookie pattern:
 * the `_csrf` cookie and the `X-CSRF-Token` header must match. Matching alone
 * proves only that the caller can read cookies — it does NOT prove the token
 * was ever minted by this deployment. Consequences:
 *
 *   - Tokens minted by a PREVIOUS gateway process keep validating forever
 *     (there is no expiry mechanism at all), so a leaked token stays usable.
 *   - Any self-consistent forged pair (attacker sets both cookie and header
 *     on their own subdomain and rides the victim's session) passes.
 *
 * This service adds server-side token state: every token the deployment
 * mints is registered in Redis with a TTL, and validation can require that
 * the presented token exists in the registry. Redis makes the registry
 * survive gateway restarts (clients' cached tokens stay valid across
 * deploys) and horizontal scale (any instance validates any minted token).
 *
 * Availability posture: CSRF is a defense-in-depth layer behind cookie
 * auth, so when Redis is unreachable the registry fails OPEN — validation
 * degrades to the plain cookie==header double-submit check rather than
 * locking out every SPA. This deliberately DIVERGES from the
 * AuthThrottlerGuard, which now fails CLOSED by default for auth endpoints
 * (AUD-20) — those endpoints are the credential-stuffing surface, while this
 * registry sits behind already-issued cookies and degrades to a real
 * (if weaker) double-submit check rather than to nothing.
 *
 * Key design: one key per token (`csrf:token:<sha256>`) rather than a set —
 * SETEX gives per-token expiry without cleanup sweeps, and EXISTS is O(1).
 */
@Injectable()
export class CsrfTokenRegistry {
  private readonly logger = new Logger(CsrfTokenRegistry.name);
  private static readonly KEY_PREFIX = 'csrf:token:';
  /** Minted tokens expire after 24h (7× the auth-cookie session length). */
  private static readonly TOKEN_TTL_SECONDS = 24 * 60 * 60;
  private redis: Redis | null = null;
  private readonly useRedis: boolean;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        // Lazy `require` mirrors AuthThrottlerGuard so test graphs without
        // ioredis never open a connection.
        const Redis = require('ioredis');
        const client = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: true,
        });
        client.on('error', (err: Error) => {
          // Swallow: fail-open degradation is logged once, not per request.
          this.logger.warn(
            `CSRF registry Redis connection error — validation degrades to plain double-submit check. ${err.message}`
          );
        });
        void client.connect().catch((err: Error) => {
          this.logger.warn(
            `CSRF registry Redis connect failed — validation degrades to plain double-submit check. ${err.message}`
          );
        });
        this.redis = client;
        this.useRedis = true;
      } catch {
        this.logger.warn('ioredis not available — CSRF registry disabled (double-submit only)');
        this.useRedis = false;
      }
    } else {
      this.logger.warn(
        'REDIS_URL not set — CSRF registry disabled; tokens are not validated against minted state'
      );
      this.useRedis = false;
    }
  }

  /**
   * True when the registry is backed by a live Redis connection.
   * When false, `isRegistered` fails open and minting is best-effort.
   */
  get available(): boolean {
    return this.useRedis && this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Register a minted token so it validates for the next 24h. Called on
   * every bootstrap (gateway safe-method mint and auth-service /auth/csrf).
   */
  async register(token: string): Promise<void> {
    if (!token) return;
    await this.store(token);
  }

  /**
   * True when the token was minted by this deployment and has not expired.
   * Fails OPEN when the registry is unavailable (Redis down / not configured):
   * validation then relies on the cookie==header double-submit check alone.
   */
  async isRegistered(token: string): Promise<boolean> {
    if (!token) return false;
    return this.store(token, true);
  }

  /**
   * Core store/exists call. `probeOnly` performs an EXISTS without writing —
   * used by validation; the write path is used by minting.
   */
  private async store(token: string, probeOnly = false): Promise<boolean> {
    if (!this.redis || this.redis.status !== 'ready') {
      return probeOnly ? true : false; // fail open on validate, skip on mint
    }
    const key = CsrfTokenRegistry.keyFor(token);
    try {
      if (probeOnly) {
        const exists = await this.redis.exists(key);
        return exists === 1;
      }
      await this.redis.set(key, '1', 'EX', CsrfTokenRegistry.TOKEN_TTL_SECONDS);
      return true;
    } catch (err) {
      this.logger.warn(
        `CSRF registry ${probeOnly ? 'probe' : 'write'} failed — failing ${probeOnly ? 'open' : 'closed-for-write'}. ${(err as Error).message}`
      );
      return probeOnly; // fail open on validate
    }
  }

  /**
   * Mint a cryptographically random token and register it. Returns the raw
   * token (it goes to the client in the `_csrf` cookie + response header).
   */
  mint(): string {
    return randomBytes(32).toString('hex');
  }

  private static keyFor(token: string): string {
    // Hash the token into the key so Redis dumps / AOF snapshots never
    // contain live CSRF material.
    const { createHash } = require('crypto') as typeof import('crypto');
    return CsrfTokenRegistry.KEY_PREFIX + createHash('sha256').update(token).digest('hex');
  }
}
