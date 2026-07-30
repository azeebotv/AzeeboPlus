/** Categories of analytics consent. */
export enum ConsentCategory {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY = 'third_party',
}

/** Represents a single analytics event to be tracked. */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
  category?: ConsentCategory;
}

/** Configuration options for the Analytics instance. */
export interface AnalyticsConfig {
  enabled?: boolean;
  debug?: boolean;
  endpoint?: string;
  flushInterval?: number;
  flushBatchSize?: number;
  defaultConsent?: Partial<Record<ConsentCategory, boolean>>;
}

/** User context attached to analytics events for identification. */
export interface UserContext {
  userId: string;
  sessionId?: string;
  plan?: string;
  platform?: string;
}

const CONSENT_STORAGE_KEY = 'azeebo_analytics_consent';

const DEFAULT_CONSENT: Record<ConsentCategory, boolean> = {
  [ConsentCategory.ESSENTIAL]: true,
  [ConsentCategory.ANALYTICS]: false,
  [ConsentCategory.MARKETING]: false,
  [ConsentCategory.PERSONALIZATION]: false,
  [ConsentCategory.THIRD_PARTY]: false,
};

/** Manages user consent state per category with localStorage persistence. */
export class ConsentManager {
  private consentState: Record<ConsentCategory, boolean>;
  private onChange?: (category: ConsentCategory, granted: boolean) => void;

  constructor(
    defaultConsent?: Partial<Record<ConsentCategory, boolean>>,
    onChange?: (category: ConsentCategory, granted: boolean) => void
  ) {
    this.onChange = onChange;
    this.consentState = { ...DEFAULT_CONSENT, ...defaultConsent };
    this.loadFromStorage();
  }

  hasConsent(category: ConsentCategory): boolean {
    return this.consentState[category] ?? false;
  }

  setConsent(category: ConsentCategory, granted: boolean): void {
    this.consentState[category] = granted;
    this.saveToStorage();
    this.onChange?.(category, granted);
  }

  getAllConsent(): Readonly<Record<ConsentCategory, boolean>> {
    return { ...this.consentState };
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<ConsentCategory, boolean>>;
        this.consentState = { ...DEFAULT_CONSENT, ...parsed };
      }
    } catch {
      // localStorage unavailable or corrupt — keep defaults
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(this.consentState));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }
}

/** Analytics SDK for tracking user events, screen views, and conversions with batching and retry. */
export class Analytics {
  private config: Required<Omit<AnalyticsConfig, 'endpoint' | 'defaultConsent'>> & {
    endpoint?: string;
    defaultConsent?: Partial<Record<ConsentCategory, boolean>>;
  };
  private queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;
  private userContext: UserContext | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private maxQueueSize = 1000;
  private consentManager: ConsentManager;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enabled: true,
      debug: false,
      flushInterval: 30000,
      flushBatchSize: 10,
      ...config,
    };

    this.consentManager = new ConsentManager(config.defaultConsent);

    if (this.config.endpoint && this.config.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const category = event.category ?? ConsentCategory.ANALYTICS;
    if (!this.consentManager.hasConsent(category)) {
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.log('[Analytics] Skipping event (no consent):', event.name, 'category:', category);
      }
      return;
    }

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      userId: event.userId || this.userContext?.userId,
      sessionId: event.sessionId || this.userContext?.sessionId,
    };

    this.queue.push(fullEvent);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.splice(0, this.queue.length - this.maxQueueSize);
    }

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
            userId: event.userId,
            sessionId: event.sessionId,
            timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.queue = [...eventsToSend, ...this.queue];
          const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
          setTimeout(() => this.flush(), delay);
        }
      } else {
        this.retryCount = 0;
      }
    } catch {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.queue = [...eventsToSend, ...this.queue];
        const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
        setTimeout(() => this.flush(), delay);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  setUser(user: UserContext | null): void {
    this.userContext = user;
    if (user) {
      this.track({
        name: 'user_identified',
        category: ConsentCategory.ESSENTIAL,
        properties: {
          user_id: user.userId,
          plan: user.plan,
          platform: user.platform,
        },
      });
    }
  }

  clearUser(): void {
    this.userContext = null;
  }

  /** Grant or revoke consent for a specific category. */
  setConsent(category: ConsentCategory, granted: boolean): void {
    this.consentManager.setConsent(category, granted);
  }

  /** Check whether consent has been granted for a specific category. */
  hasConsent(category: ConsentCategory): boolean {
    return this.consentManager.hasConsent(category);
  }

  /** Return a snapshot of all consent states. */
  getAllConsent(): Readonly<Record<ConsentCategory, boolean>> {
    return this.consentManager.getAllConsent();
  }

  getUser(): UserContext | null {
    return this.userContext;
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
      category: ConsentCategory.ESSENTIAL,
      properties: {
        screen_name: screenName,
        ...properties,
      },
    });
  }

  contentImpression(contentId: string, contentType: string, universe: string): void {
    this.track({
      name: 'content_impression',
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
      properties: { platform },
    });
  }

  signup(success: boolean, platform: string = 'web'): void {
    this.track({
      name: success ? 'signup_completed' : 'signup_failed',
      category: ConsentCategory.ESSENTIAL,
      properties: { platform },
    });
  }

  voteSubmitted(contestantId: string, amount: number, supervoted: boolean): void {
    this.track({
      name: 'vote_submitted',
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
      properties: {
        amount,
        currency,
      },
    });
  }

  rewardEarned(rewardType: string, points: number): void {
    this.track({
      name: 'reward_earned',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        reward_type: rewardType,
        points,
      },
    });
  }

  creatorFollow(creatorId: string): void {
    this.track({
      name: 'creator_follow',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        creator_id: creatorId,
      },
    });
  }

  predictionSubmitted(predictionId: string, answer: string): void {
    this.track({
      name: 'prediction_placed',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        prediction_id: predictionId,
        answer,
      },
    });
  }

  gameStarted(gameId: string): void {
    this.track({
      name: 'game_started',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        game_id: gameId,
      },
    });
  }

  gameCompleted(gameId: string, score: number): void {
    this.track({
      name: 'game_completed',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        game_id: gameId,
        score,
      },
    });
  }

  share(contentId: string): void {
    this.track({
      name: 'share',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        content_id: contentId,
      },
    });
  }

  notificationReceived(notificationId: string): void {
    this.track({
      name: 'notification_received',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        notification_id: notificationId,
      },
    });
  }

  notificationClicked(notificationId: string): void {
    this.track({
      name: 'notification_clicked',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        notification_id: notificationId,
      },
    });
  }

  playStart(contentId: string, contentType: string, universe: string): void {
    this.track({
      name: 'play_start',
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
      properties: {
        contestant_id: contestantId,
        amount,
      },
    });
  }

  paymentInitiated(amount: number, currency: string = 'NGN', paymentMethod?: string): void {
    this.track({
      name: 'payment_initiated',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        amount,
        currency,
        ...(paymentMethod ? { payment_method: paymentMethod } : {}),
      },
    });
  }

  /**
   * @deprecated Use `creatorFollow` instead.
   */
  creatorFollowed(creatorId: string): void {
    this.track({
      name: 'creator_followed',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        creator_id: creatorId,
      },
    });
  }

  /**
   * @deprecated Use `creatorTipSent` instead.
   */
  creatorTipped(creatorId: string, amount: number, currency: string = 'NGN'): void {
    this.track({
      name: 'creator_tipped',
      category: ConsentCategory.ESSENTIAL,
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
      category: ConsentCategory.ESSENTIAL,
      properties: {
        content_id: contentId,
        ...(platform ? { platform } : {}),
      },
    });
  }

  /**
   * @deprecated Use `notificationClicked` instead.
   */
  notificationOpened(notificationId: string): void {
    this.track({
      name: 'notification_opened',
      category: ConsentCategory.ESSENTIAL,
      properties: {
        notification_id: notificationId,
      },
    });
  }
}

/** Default Analytics instance configured from environment variables. */
export const analytics = new Analytics({
  enabled: process.env.NODE_ENV !== 'test',
  debug: process.env.NODE_ENV === 'development',
  endpoint: typeof process !== 'undefined' ? process.env.ANALYTICS_ENDPOINT : undefined,
});
