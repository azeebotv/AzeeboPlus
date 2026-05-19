export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface AnalyticsConfig {
  enabled?: boolean;
  debug?: boolean;
}

export class Analytics {
  private config: AnalyticsConfig;
  public queue: AnalyticsEvent[] = [];

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enabled: true,
      debug: false,
      ...config,
    };
  }

  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    this.queue.push(fullEvent);

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    // TODO: Send events to analytics backend
    // For now, just keep queue for testing
  }

  screenView(screenName: string, properties?: Record<string, unknown>): void {
    this.track({
      name: 'screen_view',
      properties: {
        screen_name: screenName,
        ...properties,
      },
    });
  }

  contentImpression(contentId: string, contentType: string, universe: string): void {
    this.track({
      name: 'content_impression',
      properties: {
        content_id: contentId,
        content_type: contentType,
        universe,
      },
    });
  }

  contentClick(contentId: string, contentType: string, universe: string): void {
    this.track({
      name: 'content_click',
      properties: {
        content_id: contentId,
        content_type: contentType,
        universe,
      },
    });
  }

  login(success: boolean, platform: string = 'web'): void {
    this.track({
      name: success ? 'login_success' : 'login_failed',
      properties: { platform },
    });
  }

  signup(success: boolean, platform: string = 'web'): void {
    this.track({
      name: success ? 'signup_completed' : 'signup_failed',
      properties: { platform },
    });
  }

  voteSubmitted(contestantId: string, amount: number, supervoted: boolean): void {
    this.track({
      name: 'vote_submitted',
      properties: {
        contestant_id: contestantId,
        amount,
        supervoted,
      },
    });
  }

  paymentSuccess(amount: number, currency: string = 'NGN'): void {
    this.track({
      name: 'payment_success',
      properties: {
        amount,
        currency,
      },
    });
  }

  rewardEarned(rewardType: string, points: number): void {
    this.track({
      name: 'reward_earned',
      properties: {
        reward_type: rewardType,
        points,
      },
    });
  }

  creatorFollow(creatorId: string): void {
    this.track({
      name: 'creator_follow',
      properties: {
        creator_id: creatorId,
      },
    });
  }

  predictionSubmitted(predictionId: string, answer: string): void {
    this.track({
      name: 'prediction_placed',
      properties: {
        prediction_id: predictionId,
        answer,
      },
    });
  }

  gameStarted(gameId: string): void {
    this.track({
      name: 'game_started',
      properties: {
        game_id: gameId,
      },
    });
  }

  gameCompleted(gameId: string, score: number): void {
    this.track({
      name: 'game_completed',
      properties: {
        game_id: gameId,
        score,
      },
    });
  }

  share(contentId: string): void {
    this.track({
      name: 'share',
      properties: {
        content_id: contentId,
      },
    });
  }

  notificationReceived(notificationId: string): void {
    this.track({
      name: 'notification_received',
      properties: {
        notification_id: notificationId,
      },
    });
  }

  notificationClicked(notificationId: string): void {
    this.track({
      name: 'notification_clicked',
      properties: {
        notification_id: notificationId,
      },
    });
  }
}

// Default instance
export const analytics = new Analytics({
  enabled: process.env.NODE_ENV !== 'test',
  debug: process.env.NODE_ENV === 'development',
});
