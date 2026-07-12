import {Inject,  Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AnalyticsEvent {
  type: string;
  userId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface AgbalaMetadata {
  session_id?: string;
  platform?: string;
  timestamp: string;
  [key: string]: unknown;
}

@Injectable()
export class AgbalaAnalyticsService {
  private readonly logger = new Logger(AgbalaAnalyticsService.name);
  private readonly analyticsServiceUrl: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.analyticsServiceUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3008'
    );
  }

  private createMetadata(additionalData?: Record<string, unknown>): AgbalaMetadata {
    return {
      session_id: `agbala_${Date.now()}`,
      platform: 'mobile',
      timestamp: new Date().toISOString(),
      ...additionalData,
    };
  }

  private async trackEvent(
    userId: string,
    event: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      type: event,
      userId,
      metadata: this.createMetadata(metadata),
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(`${this.analyticsServiceUrl}/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: [analyticsEvent] }),
      });
    } catch (error) {
      this.logger.error(`Failed to track Agbala analytics event: ${event}`, error);
    }
  }

  async trackHubViewed(userId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_hub_viewed');
  }

  async trackPathSelected(userId: string, path: 'chronological' | 'thematic'): Promise<void> {
    await this.trackEvent(userId, 'agbala_path_selected', { path });
  }

  async trackTitleWatched(userId: string, titleId: string, progress: number): Promise<void> {
    await this.trackEvent(userId, 'agbala_title_watched', {
      title_id: titleId,
      progress,
    });
  }

  async trackCharacterViewed(userId: string, characterId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_character_viewed', {
      character_id: characterId,
    });
  }

  async trackRealmExplored(userId: string, realmId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_realm_explored', {
      realm_id: realmId,
    });
  }

  async trackQuizStarted(userId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_quiz_started');
  }

  async trackQuizCompleted(userId: string, orisaAlignment: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_quiz_completed', {
      orisa_alignment: orisaAlignment,
    });
  }

  async trackMemoryFileUnlocked(userId: string, fileId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_memory_file_unlocked', {
      file_id: fileId,
    });
  }

  async trackTheorySubmitted(userId: string, theoryId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_theory_submitted', {
      theory_id: theoryId,
    });
  }

  async trackTheoryVoted(userId: string, theoryId: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_theory_voted', {
      theory_id: theoryId,
    });
  }

  async trackBlackCurrentDetected(userId: string, level: 'low' | 'medium' | 'high'): Promise<void> {
    await this.trackEvent(userId, 'agbala_black_current_detected', {
      level,
    });
  }

  async trackSubscriptionPrompted(userId: string, accessLevel: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_subscription_prompted', {
      access_level: accessLevel,
    });
  }

  async trackSubscriptionConverted(userId: string, plan: string): Promise<void> {
    await this.trackEvent(userId, 'agbala_subscription_converted', {
      plan,
    });
  }
}
