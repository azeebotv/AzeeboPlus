export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
}

export interface AnalyticsConfig {
  enabled?: boolean;
  debug?: boolean;
  endpoint?: string;
  flushInterval?: number;
  flushBatchSize?: number;
}

export class Analytics {
  private config: Required<Omit<AnalyticsConfig, 'endpoint'>> & { endpoint?: string };
  public queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enabled: true,
      debug: false,
      flushInterval: 30000,
      flushBatchSize: 10,
      ...config,
    };

    if (this.config.endpoint && this.config.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    this.queue.push(fullEvent);

    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[Analytics]', fullEvent.name, fullEvent.properties);
    }

    if (this.queue.length >= this.config.flushBatchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0 || !this.config.endpoint) return;

    this.isFlushing = true;
    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(`${this.config.endpoint}/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend.map((event) => ({
            type: event.name,
            metadata: event.properties,
            timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        // Re-queue events on failure
        this.queue = [...eventsToSend, ...this.queue];
      }
    } catch {
      // Re-queue events on network error
      this.queue = [...eventsToSend, ...this.queue];
    } finally {
      this.isFlushing = false;
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
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

  playStart(contentId: string, contentType: string, universe: string): void {
    this.track({
      name: 'play_start',
      properties: {
        content_id: contentId,
        content_type: contentType,
        universe,
      },
    });
  }

  playComplete(contentId: string, contentType: string, universe: string): void {
    this.track({
      name: 'play_complete',
      properties: {
        content_id: contentId,
        content_type: contentType,
        universe,
      },
    });
  }

  paymentFailed(amount: number, currency: string = 'NGN', reason?: string): void {
    this.track({
      name: 'payment_failed',
      properties: {
        amount,
        currency,
        ...(reason ? { reason } : {}),
      },
    });
  }

  rewardRedeemed(rewardType: string, points: number, rewardId: string): void {
    this.track({
      name: 'reward_redeemed',
      properties: {
        reward_type: rewardType,
        points,
        reward_id: rewardId,
      },
    });
  }

  creatorTipSent(creatorId: string, amount: number, currency: string = 'NGN'): void {
    this.track({
      name: 'creator_tip_sent',
      properties: {
        creator_id: creatorId,
        amount,
        currency,
      },
    });
  }

  voteInitiated(contestantId: string, amount: number): void {
    this.track({
      name: 'vote_initiated',
      properties: {
        contestant_id: contestantId,
        amount,
      },
    });
  }

  paymentInitiated(amount: number, currency: string = 'NGN', paymentMethod?: string): void {
    this.track({
      name: 'payment_initiated',
      properties: {
        amount,
        currency,
        ...(paymentMethod ? { payment_method: paymentMethod } : {}),
      },
    });
  }

  creatorFollowed(creatorId: string): void {
    this.track({
      name: 'creator_followed',
      properties: {
        creator_id: creatorId,
      },
    });
  }

  creatorTipped(creatorId: string, amount: number, currency: string = 'NGN'): void {
    this.track({
      name: 'creator_tipped',
      properties: {
        creator_id: creatorId,
        amount,
        currency,
      },
    });
  }

  shareInitiated(contentId: string, platform?: string): void {
    this.track({
      name: 'share_initiated',
      properties: {
        content_id: contentId,
        ...(platform ? { platform } : {}),
      },
    });
  }

  notificationOpened(notificationId: string): void {
    this.track({
      name: 'notification_opened',
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
  endpoint: typeof process !== 'undefined' ? process.env.ANALYTICS_ENDPOINT : undefined,
});
