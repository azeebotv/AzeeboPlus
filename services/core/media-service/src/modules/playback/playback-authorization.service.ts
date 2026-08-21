import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

/**
 * Playback Authorization Service (TAA §24, §25)
 *
 * Handles playback authorization with media policy verification:
 * - Content publish state verification
 * - Territory/region restrictions
 * - Age/access rule enforcement
 * - Rights window validation
 * - Entitlement verification
 * - Signed playback tokens
 */

export interface PlaybackRequest {
  /** Content ID to play */
  contentId: string;
  /** User ID requesting playback */
  userId: string;
  /** User's country/territory */
  territory: string;
  /** User's age (if verified) */
  age?: number;
  /** User's subscription tier */
  subscriptionTier?: string;
  /** Device type */
  deviceType: 'web' | 'ios' | 'android' | 'tv';
  /** Client IP for geo-validation */
  clientIp?: string;
}

export interface PlaybackAuthorization {
  /** Whether playback is authorized */
  authorized: boolean;
  /** Authorization token (if authorized) */
  token?: PlaybackToken;
  /** Denial reason (if not authorized) */
  denialReason?: string;
  /** Policy decisions applied */
  policyDecisions: PolicyDecision[];
}

export interface PlaybackToken {
  /** Token value */
  value: string;
  /** Content ID */
  contentId: string;
  /** User ID */
  userId: string;
  /** Expiration timestamp */
  expiresAt: Date;
  /** Allowed renditions */
  allowedRenditions: string[];
  /** Watermark info (for premium) */
  watermark?: { userId: string; timestamp: number };
}

export interface PolicyDecision {
  /** Policy name */
  policy: string;
  /** Whether policy passed */
  passed: boolean;
  /** Decision details */
  details: string;
}

export interface ContentRights {
  /** Content ID */
  contentId: string;
  /** Current status */
  status: 'draft' | 'processing' | 'published' | 'archived' | 'revoked';
  /** Territory restrictions */
  territories: string[];
  /** Age rating */
  ageRating: number;
  /** Rights window */
  rightsWindow: { start: Date; end?: Date };
  /** Entitlement required */
  entitlementRequired: boolean;
  /** Entitlement tiers */
  entitlementTiers: string[];
}

@Injectable()
export class PlaybackAuthorizationService {

  private readonly tokenSecret: string;
  private readonly tokenLifetimeMinutes: number = 10;

  constructor() {
    // In production, inject from ConfigService
    this.tokenSecret = process.env.PLAYBACK_TOKEN_SECRET || randomBytes(32).toString('hex');
  }

  /**
   * Authorize a playback request
   */
  async authorizePlayback(
    request: PlaybackRequest,
    contentRights: ContentRights
  ): Promise<PlaybackAuthorization> {
    const decisions: PolicyDecision[] = [];

    // 1. Check content publish state
    const publishCheck = this.checkPublishState(contentRights);
    decisions.push(publishCheck);

    if (!publishCheck.passed) {
      return {
        authorized: false,
        denialReason: publishCheck.details,
        policyDecisions: decisions,
      };
    }

    // 2. Check territory restrictions
    const territoryCheck = this.checkTerritory(request.territory, contentRights);
    decisions.push(territoryCheck);

    if (!territoryCheck.passed) {
      return {
        authorized: false,
        denialReason: territoryCheck.details,
        policyDecisions: decisions,
      };
    }

    // 3. Check age rating
    const ageCheck = this.checkAgeRating(request.age, contentRights);
    decisions.push(ageCheck);

    if (!ageCheck.passed) {
      return {
        authorized: false,
        denialReason: ageCheck.details,
        policyDecisions: decisions,
      };
    }

    // 4. Check rights window
    const rightsCheck = this.checkRightsWindow(contentRights);
    decisions.push(rightsCheck);

    if (!rightsCheck.passed) {
      return {
        authorized: false,
        denialReason: rightsCheck.details,
        policyDecisions: decisions,
      };
    }

    // 5. Check entitlement
    const entitlementCheck = this.checkEntitlement(
      request.subscriptionTier,
      contentRights
    );
    decisions.push(entitlementCheck);

    if (!entitlementCheck.passed) {
      return {
        authorized: false,
        denialReason: entitlementCheck.details,
        policyDecisions: decisions,
      };
    }

    // All checks passed - generate token
    const token = this.generatePlaybackToken(request, contentRights);

    return {
      authorized: true,
      token,
      policyDecisions: decisions,
    };
  }

  /**
   * Check content publish state
   */
  private checkPublishState(rights: ContentRights): PolicyDecision {
    const allowedStates = ['published'];
    const passed = allowedStates.includes(rights.status);

    return {
      policy: 'publish_state',
      passed,
      details: passed
        ? 'Content is published and available'
        : `Content status '${rights.status}' does not allow playback`,
    };
  }

  /**
   * Check territory restrictions
   */
  private checkTerritory(territory: string, rights: ContentRights): PolicyDecision {
    // Empty territories means worldwide
    if (!rights.territories || rights.territories.length === 0) {
      return {
        policy: 'territory',
        passed: true,
        details: 'No territory restrictions - worldwide availability',
      };
    }

    const allowed = rights.territories.includes(territory);      return {
        policy: 'territory',
        passed: allowed,
        details: allowed
          ? `Territory '${territory}' is allowed`
          : `Territory '${territory}' is not in allowed list`,
      };
  }

  /**
   * Check age rating
   */
  private checkAgeRating(userAge: number | undefined, rights: ContentRights): PolicyDecision {
    if (!rights.ageRating || rights.ageRating === 0) {
      return {
        policy: 'age_rating',
        passed: true,
        details: 'No age restriction',
      };
    }

    if (userAge === undefined) {
      return {
        policy: 'age_rating',
        passed: false,
        details: 'Age verification required for this content',
      };
    }

    const passed = userAge >= rights.ageRating;

    return {
      policy: 'age_rating',
      passed,
      details: passed
        ? `User age ${userAge} meets requirement ${rights.ageRating}+`
        : `User age ${userAge} does not meet requirement ${rights.ageRating}+`,
    };
  }

  /**
   * Check rights window
   */
  private checkRightsWindow(rights: ContentRights): PolicyDecision {
    const now = new Date();
    const { start, end } = rights.rightsWindow;

    if (now < start) {
      return {
        policy: 'rights_window',
        passed: false,
        details: `Rights window starts at ${start.toISOString()}`,
      };
    }

    if (end && now > end) {
      return {
        policy: 'rights_window',
        passed: false,
        details: `Rights window ended at ${end.toISOString()}`,
      };
    }

    return {
      policy: 'rights_window',
      passed: true,
      details: 'Within rights window',
    };
  }

  /**
   * Check entitlement
   */
  private checkEntitlement(
    userTier: string | undefined,
    rights: ContentRights
  ): PolicyDecision {
    if (!rights.entitlementRequired) {
      return {
        policy: 'entitlement',
        passed: true,
        details: 'No entitlement required',
      };
    }

    if (!userTier) {
      return {
        policy: 'entitlement',
        passed: false,
        details: 'Subscription required for this content',
      };
    }

    const allowed = rights.entitlementTiers.includes(userTier);

    return {
      policy: 'entitlement',
      passed: allowed,
      details: allowed
        ? `Tier '${userTier}' has access`
        : `Tier '${userTier}' does not have access`,
    };
  }

  /**
   * Generate a signed playback token
   */
  private generatePlaybackToken(
    request: PlaybackRequest,
    _rights: ContentRights
  ): PlaybackToken {
    const expiresAt = new Date(Date.now() + this.tokenLifetimeMinutes * 60 * 1000);

    const payload = {
      contentId: request.contentId,
      userId: request.userId,
      expiresAt: expiresAt.toISOString(),
      iat: Date.now(),
    };

    // Create HMAC signature
    const signature = createHash('sha256')
      .update(JSON.stringify(payload) + this.tokenSecret)
      .digest('hex');

    const tokenValue = Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString(
      'base64url'
    );

    return {
      value: tokenValue,
      contentId: request.contentId,
      userId: request.userId,
      expiresAt,
      allowedRenditions: ['1080p', '720p', '480p', '360p', 'data-saver'],
      watermark: {
        userId: request.userId,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Validate a playback token
   */
  validateToken(tokenValue: string): {
    valid: boolean;
    payload?: { contentId: string; userId: string; expiresAt: string };
    error?: string;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(tokenValue, 'base64url').toString());
      const { sig, ...payload } = decoded;

      // Verify signature
      const expectedSig = createHash('sha256')
        .update(JSON.stringify(payload) + this.tokenSecret)
        .digest('hex');

      if (sig !== expectedSig) {
        return { valid: false, error: 'Invalid token signature' };
      }

      // Check expiration
      if (new Date(decoded.expiresAt) < new Date()) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false, error: 'Invalid token format' };
    }
  }

  /**
   * Check if an active stream should be interrupted on token expiry
   */
  shouldInterruptStream(tokenValue: string): boolean {
    const result = this.validateToken(tokenValue);
    if (!result.valid) return true;

    // Check if token expires within 30 seconds
    const expiresAt = new Date(result.payload!.expiresAt);
    const now = new Date();
    const secondsUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000;

    return secondsUntilExpiry <= 30;
  }
}
