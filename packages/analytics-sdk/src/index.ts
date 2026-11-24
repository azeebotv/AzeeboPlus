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
  /**
   * Sampling config resolution: when `clientSampling` is true (default) the SDK
   * fetches `GET {endpoint}/v1/analytics/bootstrap` once and pre-samples events
   * client-side using the server's `analytics_client_sampling` flag + rate.
   */
  clientSampling?: boolean;
  /** Bootstrap fetch TTL in ms (default 5 minutes). */
  bootstrapTtlMs?: number;
}

/** Client-side sampling config resolved from the analytics bootstrap endpoint. */
export interface SamplingConfig {
  enabled: boolean;
  samplingRate: number;
}

const DEFAULT_SAMPLING: SamplingConfig = { enabled: false, samplingRate: 100 };

/** Deterministic per-entity sampling so a user is fully kept or fully dropped. */
export function isEntitySampled(entity: string | undefined, rate: number): boolean {
  if (rate >= 100) return true;
  if (rate <= 0) return false;
  const seed = entity ?? 'anonymous';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < rate;
}

/** User context attached to analytics events for identification. */
export interface UserContext {
  userId: string;
  sessionId?: string;
  plan?: string;
  platform?: string;
}

const CONSENT_COOKIE_NAME = '__Host-azeebo_consent';
const CONSENT_COOKIE_VERSION = '1.0';
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** Legacy SDK-local storage key — read-only fallback, never written. */
const CONSENT_STORAGE_KEY = 'azeebo_analytics_consent';

/** Shape of the shared first-party consent cookie written by the host app. */
interface SharedConsentCookie {
  necessary?: boolean;
  analytics?: boolean;
  marketing?: boolean;
  timestamp?: string;
  version?: string;
}

const DEFAULT_CONSENT: Record<ConsentCategory, boolean> = {
  [ConsentCategory.ESSENTIAL]: true,
  [ConsentCategory.ANALYTICS]: false,
  [ConsentCategory.MARKETING]: false,
  [ConsentCategory.PERSONALIZATION]: false,
  [ConsentCategory.THIRD_PARTY]: false,
};

/**
 * Manages user consent state per category, reading and writing the host
 * app's shared `__Host-azeebo_consent` cookie (AUD-45) so the banner, the
 * analytics layer, and server-side gating all observe one value. The
 * SDK-local localStorage record is honoured as a legacy read fallback.
 */
export class ConsentManager {
  private consentState: Record<ConsentCategory, boolean>;
  private onChange?: (category: ConsentCategory, granted: boolean) => void;

  constructor(
    defaultConsent?: Partial<Record<ConsentCategory, boolean>>,
    onChange?: (category: ConsentCategory, granted: boolean) => void
  ) {
    this.onChange = onChange;
    this.consentState = { ...DEFAULT_CONSENT, ...defaultConsent };
    this.load();
  }

  hasConsent(category: ConsentCategory): boolean {
    return this.consentState[category] ?? false;
  }

  setConsent(category: ConsentCategory, granted: boolean): void {
    this.consentState[category] = granted;
    this.save();
    this.onChange?.(category, granted);
  }

  getAllConsent(): Readonly<Record<ConsentCategory, boolean>> {
    return { ...this.consentState };
  }

  private load(): void {
    try {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(
          new RegExp('(?:^|;\\s*)' + CONSENT_COOKIE_NAME + '=([^;]*)')
        );
        if (match?.[1]) {
          const parsed = JSON.parse(decodeURIComponent(match[1])) as SharedConsentCookie | null;
          if (parsed && typeof parsed === 'object' && parsed.version === CONSENT_COOKIE_VERSION) {
            // The shared cookie has no field for SDK-only categories
            // (personalization, third_party) — they keep their defaults.
            this.consentState = {
              ...this.consentState,
              essential: parsed.necessary === true,
              analytics: parsed.analytics === true,
              marketing: parsed.marketing === true,
            };
            return;
          }
        }
      }
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<ConsentCategory, boolean>>;
          this.consentState = { ...DEFAULT_CONSENT, ...parsed };
        }
      }
    } catch {
      // storage unavailable or corrupt — keep current state
    }
  }

  private save(): void {
    try {
      if (typeof document === 'undefined') return;
      const payload: SharedConsentCookie = {
        necessary: this.consentState[ConsentCategory.ESSENTIAL],
        analytics: this.consentState[ConsentCategory.ANALYTICS],
        marketing: this.consentState[ConsentCategory.MARKETING],
        timestamp: new Date().toISOString(),
        version: CONSENT_COOKIE_VERSION,
      };
      // `__Host-` requires Secure + Path=/ and forbids a Domain attribute.
      document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify(payload)
      )}; Path=/; Secure; SameSite=Lax; Max-Age=${CONSENT_COOKIE_MAX_AGE}`;
      // The cookie is now the single source — retire the SDK-local copy.
      try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      } catch {
        // storage unavailable — nothing to retire
      }
    } catch {
      // storage unavailable — silently ignore
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
  private samplingConfig: SamplingConfig = DEFAULT_SAMPLING;
  private samplingFetchedAt = 0;
  private samplingFetchPromise: Promise<void> | null = null;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enabled: true,
      debug: false,
      flushInterval: 30000,
      flushBatchSize: 10,
      clientSampling: true,
      bootstrapTtlMs: 5 * 60 * 1000,
      ...config,
    };

    this.consentManager = new ConsentManager(config.defaultConsent, (category, granted) => {
      // AUD-45: revoking consent must drop everything already queued and
      // forget the user context — collected-but-unsent data is still
      // collected data.
      if (!granted && category === ConsentCategory.ANALYTICS) {
        this.queue = [];
        this.userContext = null;
      }
    });

    if (this.config.clientSampling !== false && this.config.endpoint) {
      void this.refreshSamplingConfig();
    }

    if (this.config.endpoint && this.config.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Fetches the server-side sampling config (`analytics_client_sampling` flag +
   * effective rate) from the bootstrap endpoint. Falls back to full sampling on
   * any error so tracking is never blocked by this call.
   */
  async refreshSamplingConfig(): Promise<SamplingConfig> {
    if (!this.config.endpoint || this.config.clientSampling === false) {
      return DEFAULT_SAMPLING;
    }
    if (this.samplingFetchPromise) {
      await this.samplingFetchPromise;
      return this.samplingConfig;
    }
    this.samplingFetchPromise = (async () => {
      try {
        const now = Date.now();
        if (now - this.samplingFetchedAt < (this.config.bootstrapTtlMs ?? 5 * 60 * 1000)) {
          return;
        }
        const response = await fetch(`${this.config.endpoint}/v1/analytics/bootstrap`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return;
        const body = (await response.json()) as { success?: boolean; data?: SamplingConfig };
        if (body?.data) {
          this.samplingConfig = {
            enabled: body.data.enabled === true,
            samplingRate: typeof body.data.samplingRate === 'number' ? body.data.samplingRate : 100,
          };
          this.samplingFetchedAt = Date.now();
        }
      } catch {
        // Bootstrap unavailable — keep full sampling
      } finally {
        this.samplingFetchPromise = null;
      }
    })();
    await this.samplingFetchPromise;
    return this.samplingConfig;
  }

  /** Whether a given entity should be sent given the current sampling config. */
  shouldSample(entity: string | undefined): boolean {
    return isEntitySampled(entity, this.samplingConfig.samplingRate);
  }

  getSamplingConfig(): Readonly<SamplingConfig> {
    return this.samplingConfig;
  }

  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const category = event.category ?? ConsentCategory.ANALYTICS;
    if (!this.consentManager.hasConsent(category)) {
      if (this.config.debug) {
        // eslint-disable-next-line no-console, azeebo-custom/no-console-log
        console.log('[Analytics] Skipping event (no consent):', event.name, 'category:', category);
      }
      return;
    }

    // Client-side sampling (mirrors the server's deterministic per-entity hash).
    if (this.samplingConfig.enabled) {
      const entity = event.userId ?? event.sessionId ?? this.userContext?.userId;
      if (!this.shouldSample(entity)) {
        if (this.config.debug) {
          // eslint-disable-next-line no-console, azeebo-custom/no-console-log
          console.log('[Analytics] Skipping event (sampled out):', event.name);
        }
        return;
      }
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
      // eslint-disable-next-line no-console, azeebo-custom/no-console-log
      console.log('[Analytics]', fullEvent.name, fullEvent.properties);
    }

    if (this.queue.length >= this.config.flushBatchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    // `endpoint: ''` selects a same-origin relative POST target, so only an
    // undefined endpoint disables delivery.
    if (this.isFlushing || this.queue.length === 0 || this.config.endpoint === undefined) return;

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
          // Server-side consent enforcement: the server drops any event whose
          // category was not granted, and keeps a ledger of this state.
          consent: {
            analytics: this.consentManager.hasConsent(ConsentCategory.ANALYTICS),
            marketing: this.consentManager.hasConsent(ConsentCategory.MARKETING),
            personalization: this.consentManager.hasConsent(ConsentCategory.PERSONALIZATION),
            third_party: this.consentManager.hasConsent(ConsentCategory.THIRD_PARTY),
          },
          consentVersion: 'sdk-1.0',
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
      // Identity events are analytics-category (not ESSENTIAL): they carry
      // user_id/plan and must never be collected for opted-out visitors.
      this.track({
        name: 'user_identified',
        category: ConsentCategory.ANALYTICS,
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
