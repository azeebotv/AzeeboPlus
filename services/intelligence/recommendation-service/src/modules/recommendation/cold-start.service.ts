import { Injectable } from '@nestjs/common';

// ============================================================================
// Cold-Start User Handling
//
// Handles new users with limited interaction history by:
// - Using demographic-based recommendations
// - Leveraging trending content
// - Applying popularity-based fallbacks
// - Progressive personalization as data accumulates
// ============================================================================

export type UserStage = 'cold' | 'warm' | 'hot';

export interface UserProfile {
  userId: string;
  /** Account age in days */
  accountAgeDays: number;
  /** Number of interactions */
  interactionCount: number;
  /** Number of content views */
  contentViewCount: number;
  /** Number of completions */
  completionCount: number;
  /** Known preferences */
  preferences?: {
    genres?: string[];
    universes?: string[];
    contentTypes?: string[];
  };
  /** Demographics (if available) */
  demographics?: {
    country?: string;
    ageRange?: string;
    platform?: string;
  };
}

export interface ColdStartStrategy {
  type: 'trending' | 'popular' | 'demographic' | 'diverse' | 'personalized';
  weight: number;
  description: string;
}

@Injectable()
export class ColdStartService {
  // Thresholds for user stages
  private readonly STAGE_THRESHOLDS = {
    cold: { maxInteractions: 10, maxAccountAgeDays: 7 },
    warm: { maxInteractions: 50, maxAccountAgeDays: 30 },
  };

  /**
   * Determine user stage
   */
  getUserStage(profile: UserProfile): UserStage {
    if (
      profile.interactionCount <= this.STAGE_THRESHOLDS.cold.maxInteractions &&
      profile.accountAgeDays <= this.STAGE_THRESHOLDS.cold.maxAccountAgeDays
    ) {
      return 'cold';
    }

    if (
      profile.interactionCount <= this.STAGE_THRESHOLDS.warm.maxInteractions &&
      profile.accountAgeDays <= this.STAGE_THRESHOLDS.warm.maxAccountAgeDays
    ) {
      return 'warm';
    }

    return 'hot';
  }

  /**
   * Get recommendation strategies for user stage
   */
  getStrategies(profile: UserProfile): ColdStartStrategy[] {
    const stage = this.getUserStage(profile);

    switch (stage) {
      case 'cold':
        return this.getColdStrategies(profile);
      case 'warm':
        return this.getWarmStrategies(profile);
      case 'hot':
        return this.getHotStrategies(profile);
    }
  }

  /**
   * Get strategies for cold users
   */
  private getColdStrategies(profile: UserProfile): ColdStartStrategy[] {
    const strategies: ColdStartStrategy[] = [];

    // Always include trending for cold users
    strategies.push({
      type: 'trending',
      weight: 0.4,
      description: 'Show trending content to new users',
    });

    // Include popular content
    strategies.push({
      type: 'popular',
      weight: 0.3,
      description: 'Show popular content across platform',
    });

    // If demographics available, use demographic-based
    if (profile.demographics?.country) {
      strategies.push({
        type: 'demographic',
        weight: 0.2,
        description: `Recommend based on ${profile.demographics.country} preferences`,
      });
    }

    // Include diverse content to explore interests
    strategies.push({
      type: 'diverse',
      weight: 0.1,
      description: 'Show diverse content to discover interests',
    });

    return strategies;
  }

  /**
   * Get strategies for warm users
   */
  private getWarmStrategies(_profile: UserProfile): ColdStartStrategy[] {
    const strategies: ColdStartStrategy[] = [];

    // Start personalizing based on interactions
    strategies.push({
      type: 'personalized',
      weight: 0.5,
      description: 'Personalized recommendations based on interaction history',
    });

    // Still include some trending
    strategies.push({
      type: 'trending',
      weight: 0.2,
      description: 'Mix in trending content',
    });

    // Popular as fallback
    strategies.push({
      type: 'popular',
      weight: 0.2,
      description: 'Popular content as fallback',
    });

    // Diverse for exploration
    strategies.push({
      type: 'diverse',
      weight: 0.1,
      description: 'Continue exploring interests',
    });

    return strategies;
  }

  /**
   * Get strategies for hot (established) users
   */
  private getHotStrategies(_profile: UserProfile): ColdStartStrategy[] {
    return [
      {
        type: 'personalized',
        weight: 0.9,
        description: 'Fully personalized recommendations',
      },
      {
        type: 'diverse',
        weight: 0.1,
        description: 'Small diversity component for discovery',
      },
    ];
  }

  /**
   * Get initial content for cold users
   */
  getInitialContent(profile: UserProfile): {
    trending: boolean;
    popular: boolean;
    diverse: boolean;
    limit: number;
  } {
    const stage = this.getUserStage(profile);

    return {
      trending: stage === 'cold' || stage === 'warm',
      popular: stage === 'cold',
      diverse: stage === 'cold',
      limit: stage === 'cold' ? 20 : stage === 'warm' ? 15 : 10,
    };
  }

  /**
   * Calculate personalization confidence
   */
  getPersonalizationConfidence(profile: UserProfile): number {
    const stage = this.getUserStage(profile);

    switch (stage) {
      case 'cold':
        return 0.1;
      case 'warm':
        return 0.5;
      case 'hot':
        return Math.min(0.9, 0.5 + (profile.interactionCount / 1000) * 0.4);
    }
  }

  /**
   * Check if user needs onboarding
   */
  needsOnboarding(profile: UserProfile): boolean {
    return profile.interactionCount === 0 && profile.accountAgeDays <= 1;
  }

  /**
   * Get onboarding preferences to collect
   */
  getOnboardingPreferences(_profile?: UserProfile): Array<{
    id: string;
    question: string;
    options: string[];
  }> {
    return [
      {
        id: 'genres',
        question: 'What genres do you enjoy?',
        options: ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Documentary'],
      },
      {
        id: 'universes',
        question: 'Which universes interest you?',
        options: ['Reality', 'Movies', 'Comedy', 'Sports', 'Lifestyle', 'Gaming'],
      },
      {
        id: 'contentTypes',
        question: 'What content formats do you prefer?',
        options: ['Short clips', 'Full episodes', 'Live streams', 'Podcasts'],
      },
    ];
  }
}
