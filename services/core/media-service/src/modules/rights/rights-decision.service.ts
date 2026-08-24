import { Injectable } from '@nestjs/common';

/**
 * Rights Decision Service (TAA §26)
 *
 * Server-side availability computation combining:
 * - Content state
 * - Territory
 * - Rights window
 * - Platform
 * - Age/classification
 * - Entitlement
 *
 * Single policy decision reused by Explore/Search/Title Detail/Playback
 */

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'LOCKED'
  | 'TEASED'
  | 'HIDDEN'
  | 'UNAVAILABLE'
  | 'GEO_BLOCKED'
  | 'AGE_RESTRICTED'
  | 'ENTITLEMENT_REQUIRED';

export interface RightsContext {
  /** Content ID */
  contentId: string;
  /** Content status */
  contentStatus: 'draft' | 'processing' | 'published' | 'archived' | 'revoked';
  /** Territory restrictions */
  territories: string[];
  /** Rights window */
  rightsWindow: { start: Date; end?: Date };
  /** Age rating */
  ageRating: number;
  /** Entitlement required */
  entitlementRequired: boolean;
  /** Entitlement tiers */
  entitlementTiers: string[];
  /** Platform restrictions */
  platforms: string[];
  /** Whether content has spoiler-safe view */
  hasSpoilerView: boolean;
}

export interface UserContext {
  /** User ID */
  userId?: string;
  /** User's territory */
  territory: string;
  /** User's age */
  age?: number;
  /** User's subscription tier */
  subscriptionTier?: string;
  /** User's platform */
  platform: string;
  /** User's knowledge state (for storyworld) */
  knowledgeState?: string[];
}

export interface RightsDecision {
  /** Content ID */
  contentId: string;
  /** Availability status */
  status: AvailabilityStatus;
  /** Denial reason (if not available) */
  denialReason?: string;
  /** Policy decisions applied */
  policyDecisions: PolicyEvaluation[];
  /** Decision timestamp */
  decidedAt: Date;
  /** Cache key for this decision */
  cacheKey: string;
}

export interface PolicyEvaluation {
  /** Policy name */
  policy: string;
  /** Whether policy passed */
  passed: boolean;
  /** Decision details */
  details: string;
  /** Impact on availability */
  impact: 'allow' | 'deny' | 'modify';
}

@Injectable()
export class RightsDecisionService {
  /**
   * Compute availability for content based on rights context and user context
   */
  computeAvailability(rights: RightsContext, user: UserContext): RightsDecision {
    const decisions: PolicyEvaluation[] = [];

    // 1. Content state check
    const contentState = this.evaluateContentState(rights);
    decisions.push(contentState);

    if (!contentState.passed) {
      return this.buildDecision(rights.contentId, 'UNAVAILABLE', decisions);
    }

    // 2. Territory check
    const territory = this.evaluateTerritory(rights, user);
    decisions.push(territory);

    if (!territory.passed) {
      return this.buildDecision(rights.contentId, 'GEO_BLOCKED', decisions);
    }

    // 3. Rights window check
    const rightsWindow = this.evaluateRightsWindow(rights);
    decisions.push(rightsWindow);

    if (!rightsWindow.passed) {
      return this.buildDecision(rights.contentId, 'UNAVAILABLE', decisions);
    }

    // 4. Platform check
    const platform = this.evaluatePlatform(rights, user);
    decisions.push(platform);

    if (!platform.passed) {
      return this.buildDecision(rights.contentId, 'UNAVAILABLE', decisions);
    }

    // 5. Age rating check
    const ageRating = this.evaluateAgeRating(rights, user);
    decisions.push(ageRating);

    if (!ageRating.passed) {
      return this.buildDecision(rights.contentId, 'AGE_RESTRICTED', decisions);
    }

    // 6. Entitlement check
    const entitlement = this.evaluateEntitlement(rights, user);
    decisions.push(entitlement);

    if (!entitlement.passed) {
      return this.buildDecision(rights.contentId, 'ENTITLEMENT_REQUIRED', decisions);
    }

    // 7. Spoiler-safe view check (for storyworld)
    const spoiler = this.evaluateSpoilerView(rights, user);
    decisions.push(spoiler);

    if (spoiler.impact === 'modify') {
      return this.buildDecision(rights.contentId, 'TEASED', decisions);
    }

    // All checks passed
    return this.buildDecision(rights.contentId, 'AVAILABLE', decisions);
  }

  /**
   * Evaluate content state policy
   */
  private evaluateContentState(rights: RightsContext): PolicyEvaluation {
    const allowed = ['published'].includes(rights.contentStatus);

    return {
      policy: 'content_state',
      passed: allowed,
      details: allowed
        ? 'Content is published'
        : `Content status '${rights.contentStatus}' does not allow access`,
      impact: allowed ? 'allow' : 'deny',
    };
  }

  /**
   * Evaluate territory policy
   */
  private evaluateTerritory(rights: RightsContext, user: UserContext): PolicyEvaluation {
    if (!rights.territories || rights.territories.length === 0) {
      return {
        policy: 'territory',
        passed: true,
        details: 'No territory restrictions',
        impact: 'allow',
      };
    }

    const allowed = rights.territories.includes(user.territory);

    return {
      policy: 'territory',
      passed: allowed,
      details: allowed
        ? `Territory '${user.territory}' is allowed`
        : `Territory '${user.territory}' is blocked`,
      impact: allowed ? 'allow' : 'deny',
    };
  }

  /**
   * Evaluate rights window policy
   */
  private evaluateRightsWindow(rights: RightsContext): PolicyEvaluation {
    const now = new Date();
    const { start, end } = rights.rightsWindow;

    if (now < start) {
      return {
        policy: 'rights_window',
        passed: false,
        details: `Rights window opens at ${start.toISOString()}`,
        impact: 'deny',
      };
    }

    if (end && now > end) {
      return {
        policy: 'rights_window',
        passed: false,
        details: `Rights window closed at ${end.toISOString()}`,
        impact: 'deny',
      };
    }

    return {
      policy: 'rights_window',
      passed: true,
      details: 'Within rights window',
      impact: 'allow',
    };
  }

  /**
   * Evaluate platform policy
   */
  private evaluatePlatform(rights: RightsContext, user: UserContext): PolicyEvaluation {
    if (!rights.platforms || rights.platforms.length === 0) {
      return {
        policy: 'platform',
        passed: true,
        details: 'No platform restrictions',
        impact: 'allow',
      };
    }

    const allowed = rights.platforms.includes(user.platform);

    return {
      policy: 'platform',
      passed: allowed,
      details: allowed
        ? `Platform '${user.platform}' is allowed`
        : `Platform '${user.platform}' is not supported`,
      impact: allowed ? 'allow' : 'deny',
    };
  }

  /**
   * Evaluate age rating policy
   */
  private evaluateAgeRating(rights: RightsContext, user: UserContext): PolicyEvaluation {
    if (!rights.ageRating || rights.ageRating === 0) {
      return {
        policy: 'age_rating',
        passed: true,
        details: 'No age restriction',
        impact: 'allow',
      };
    }

    if (user.age === undefined) {
      return {
        policy: 'age_rating',
        passed: false,
        details: 'Age verification required',
        impact: 'deny',
      };
    }

    const passed = user.age >= rights.ageRating;

    return {
      policy: 'age_rating',
      passed,
      details: passed
        ? `Age ${user.age} meets requirement ${rights.ageRating}+`
        : `Age ${user.age} below requirement ${rights.ageRating}+`,
      impact: passed ? 'allow' : 'deny',
    };
  }

  /**
   * Evaluate entitlement policy
   */
  private evaluateEntitlement(rights: RightsContext, user: UserContext): PolicyEvaluation {
    if (!rights.entitlementRequired) {
      return {
        policy: 'entitlement',
        passed: true,
        details: 'No entitlement required',
        impact: 'allow',
      };
    }

    if (!user.subscriptionTier) {
      return {
        policy: 'entitlement',
        passed: false,
        details: 'Subscription required',
        impact: 'deny',
      };
    }

    const allowed = rights.entitlementTiers.includes(user.subscriptionTier);

    return {
      policy: 'entitlement',
      passed: allowed,
      details: allowed
        ? `Tier '${user.subscriptionTier}' has access`
        : `Tier '${user.subscriptionTier}' does not have access`,
      impact: allowed ? 'allow' : 'deny',
    };
  }

  /**
   * Evaluate spoiler view policy (for storyworld)
   */
  private evaluateSpoilerView(rights: RightsContext, user: UserContext): PolicyEvaluation {
    if (!rights.hasSpoilerView) {
      return {
        policy: 'spoiler_view',
        passed: true,
        details: 'No spoiler view required',
        impact: 'allow',
      };
    }

    // If user has no knowledge state, show teaser
    if (!user.knowledgeState || user.knowledgeState.length === 0) {
      return {
        policy: 'spoiler_view',
        passed: true,
        details: 'Showing teaser view',
        impact: 'modify',
      };
    }

    return {
      policy: 'spoiler_view',
      passed: true,
      details: 'User knowledge state available',
      impact: 'allow',
    };
  }

  /**
   * Build a rights decision
   */
  private buildDecision(
    contentId: string,
    status: AvailabilityStatus,
    decisions: PolicyEvaluation[]
  ): RightsDecision {
    const deniedPolicies = decisions.filter((d) => !d.passed);
    const denialReason =
      deniedPolicies.length > 0 ? deniedPolicies.map((d) => d.details).join('; ') : undefined;

    return {
      contentId,
      status,
      denialReason,
      policyDecisions: decisions,
      decidedAt: new Date(),
      cacheKey: `rights:${contentId}:${status}`,
    };
  }

  /**
   * Generate cache key for a rights decision
   */
  generateCacheKey(rights: RightsContext, user: UserContext): string {
    const parts = [
      rights.contentId,
      user.territory,
      user.platform,
      user.subscriptionTier || 'free',
      user.age?.toString() || 'unknown',
    ];
    return `rights:${parts.join(':')}`;
  }

  /**
   * Invalidate rights cache for content
   */
  invalidateCache(contentId: string): string {
    return `rights:${contentId}:*`;
  }
}
