import { webLogger } from '@/lib/logger';
type EventName = string;
type EventProperties = Record<string, unknown>;

interface AnalyticsEvent {
  name: EventName;
  properties?: EventProperties;
  timestamp: Date;
}

const MAX_BUFFER_SIZE = 100;

class Analytics {
  private events: AnalyticsEvent[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';
  private userId: string | null = null;

  private track(eventName: EventName, properties?: EventProperties): void {
    if (this.isDevelopment) {
      webLogger.log(`[Analytics] ${eventName}`, properties);
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId ?? undefined,
        environment: process.env.NODE_ENV,
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
      timestamp: new Date(),
    };

    if (this.events.length >= MAX_BUFFER_SIZE) {
      this.events.shift();
    }
    this.events.push(event);

    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...properties,
      });
    }

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', { user_id: userId });
    }
  }

  clearUser(): void {
    this.userId = null;
  }

  pageView(page: string, properties?: EventProperties): void {
    this.track('page_view', {
      page,
      ...properties,
    });
  }

  userSignedUp(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_signup_viewed', {
      method,
      ...properties,
    });
  }

  userSignupSubmitted(
    method: 'email' | 'google' | 'apple',
    data: Record<string, unknown>,
    properties?: EventProperties
  ): void {
    this.track('user_signup_submitted', {
      method,
      data: Object.keys(data),
      ...properties,
    });
  }

  userSignupCompleted(
    userId: string,
    method: 'email' | 'google' | 'apple',
    properties?: EventProperties
  ): void {
    this.track('user_signup_completed', {
      userId,
      method,
      ...properties,
    });
    this.setUserId(userId);
  }

  userSignupFailed(
    method: 'email' | 'google' | 'apple',
    error: string,
    properties?: EventProperties
  ): void {
    this.track('user_signup_failed', {
      method,
      error,
      ...properties,
    });
  }

  userLoggedIn(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_login_viewed', {
      method,
      ...properties,
    });
  }

  userLoginSubmitted(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_login_submitted', {
      method,
      ...properties,
    });
  }

  userLoginCompleted(
    userId: string,
    method: 'email' | 'google' | 'apple',
    properties?: EventProperties
  ): void {
    this.track('user_login_completed', {
      userId,
      method,
      ...properties,
    });
    this.setUserId(userId);
  }

  userLoginFailed(
    method: 'email' | 'google' | 'apple',
    error: string,
    properties?: EventProperties
  ): void {
    this.track('user_login_failed', {
      method,
      error,
      ...properties,
    });
  }

  userLoggedOut(properties?: EventProperties): void {
    this.track('user_logged_out', properties);
    this.clearUser();
  }

  contentSearched(
    query: string,
    _filters?: Record<string, unknown>,
    properties?: EventProperties
  ): void {
    this.track('content_search_viewed', {
      query,
      ...properties,
    });
  }

  contentSearchSubmitted(
    query: string,
    filters?: Record<string, unknown>,
    properties?: EventProperties
  ): void {
    this.track('content_search_submitted', {
      query,
      filters: filters ? Object.keys(filters) : undefined,
      ...properties,
    });
  }

  contentSearchResults(query: string, resultsCount: number, properties?: EventProperties): void {
    this.track('content_search_completed', {
      query,
      resultsCount,
      ...properties,
    });
  }

  contentSearchFailed(query: string, error: string, properties?: EventProperties): void {
    this.track('content_search_failed', {
      query,
      error,
      ...properties,
    });
  }

  contentViewed(
    contentId: string,
    contentType: string,
    title: string,
    universe: string,
    properties?: EventProperties
  ): void {
    this.track('content_viewed', {
      contentId,
      contentType,
      title,
      universe,
      ...properties,
    });
  }

  contentPlayStarted(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('play_start', {
      contentId,
      contentType,
      ...properties,
    });
  }

  contentPlayCompleted(
    contentId: string,
    contentType: string,
    watchDuration: number,
    properties?: EventProperties
  ): void {
    this.track('play_complete', {
      contentId,
      contentType,
      watchDuration,
      ...properties,
    });
  }

  contentPlayFailed(
    contentId: string,
    contentType: string,
    error: string,
    properties?: EventProperties
  ): void {
    this.track('content_play_failed', {
      contentId,
      contentType,
      error,
      ...properties,
    });
  }

  contentPaused(
    contentId: string,
    contentType: string,
    pausedAt: number,
    properties?: EventProperties
  ): void {
    this.track('content_paused', {
      contentId,
      contentType,
      pausedAt,
      ...properties,
    });
  }

  contentSaved(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_saved', {
      contentId,
      contentType,
      ...properties,
    });
  }

  contentShared(
    contentId: string,
    contentType: string,
    shareMethod: 'copy_link' | 'twitter' | 'facebook' | 'email',
    properties?: EventProperties
  ): void {
    this.track('content_shared', {
      contentId,
      contentType,
      shareMethod,
      ...properties,
    });
  }

  contentLiked(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_liked', {
      contentId,
      contentType,
      ...properties,
    });
  }

  contentCommented(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_commented', {
      contentId,
      contentType,
      ...properties,
    });
  }

  paymentViewed(
    amount: number,
    currency: string,
    paymentMethod: string,
    properties?: EventProperties
  ): void {
    this.track('payment_viewed', {
      amount,
      currency,
      paymentMethod,
      ...properties,
    });
  }

  paymentSubmitted(
    amount: number,
    currency: string,
    paymentMethod: string,
    properties?: EventProperties
  ): void {
    this.track('payment_submitted', {
      amount,
      currency,
      paymentMethod,
      ...properties,
    });
  }

  paymentProcessed(
    transactionId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    properties?: EventProperties
  ): void {
    this.track('payment_completed', {
      transactionId,
      amount,
      currency,
      paymentMethod,
      ...properties,
    });
  }

  paymentFailed(
    amount: number,
    currency: string,
    paymentMethod: string,
    error: string,
    properties?: EventProperties
  ): void {
    this.track('payment_failed', {
      amount,
      currency,
      paymentMethod,
      error,
      ...properties,
    });
  }

  walletFunded(
    amount: number,
    currency: string,
    fundingSource: string,
    properties?: EventProperties
  ): void {
    this.track('wallet_funded', {
      amount,
      currency,
      fundingSource,
      ...properties,
    });
  }

  walletWithdrawal(
    amount: number,
    currency: string,
    withdrawalMethod: string,
    properties?: EventProperties
  ): void {
    this.track('wallet_withdrawal_initiated', {
      amount,
      currency,
      withdrawalMethod,
      ...properties,
    });
  }

  walletWithdrawalCompleted(
    amount: number,
    currency: string,
    transactionId: string,
    properties?: EventProperties
  ): void {
    this.track('wallet_withdrawal_completed', {
      amount,
      currency,
      transactionId,
      ...properties,
    });
  }

  subscriptionStarted(
    planId: string,
    planName: string,
    billingCycle: 'monthly' | 'yearly',
    properties?: EventProperties
  ): void {
    this.track('subscription_started', {
      planId,
      planName,
      billingCycle,
      ...properties,
    });
  }

  subscriptionCancelled(
    planId: string,
    planName: string,
    reason?: string,
    properties?: EventProperties
  ): void {
    this.track('subscription_cancelled', {
      planId,
      planName,
      reason,
      ...properties,
    });
  }

  subscriptionRenewed(
    planId: string,
    planName: string,
    billingCycle: 'monthly' | 'yearly',
    properties?: EventProperties
  ): void {
    this.track('subscription_renewed', {
      planId,
      planName,
      billingCycle,
      ...properties,
    });
  }

  rewardEarned(
    rewardType: string,
    amount: number,
    reason: string,
    properties?: EventProperties
  ): void {
    this.track('reward_earned', {
      rewardType,
      amount,
      reason,
      ...properties,
    });
  }

  rewardRedeemed(
    rewardType: string,
    amount: number,
    redeemedFor: string,
    properties?: EventProperties
  ): void {
    this.track('reward_redeemed', {
      rewardType,
      amount,
      redeemedFor,
      ...properties,
    });
  }

  creatorDashboardViewed(properties?: EventProperties): void {
    this.track('creator_dashboard_viewed', properties);
  }

  contentUploaded(properties?: EventProperties): void {
    this.track('content_upload_started', properties);
  }

  contentUploadCompleted(
    contentId: string,
    contentType: string,
    properties?: EventProperties
  ): void {
    this.track('content_upload_completed', {
      contentId,
      contentType,
      ...properties,
    });
  }

  contentUploadFailed(contentType: string, error: string, properties?: EventProperties): void {
    this.track('content_upload_failed', {
      contentType,
      error,
      ...properties,
    });
  }

  errorOccurred(error: string, context: string, properties?: EventProperties): void {
    this.track('error_occurred', {
      error,
      context,
      ...properties,
    });
  }

  performanceMetric(metricName: string, value: number, properties?: EventProperties): void {
    this.track(`performance_${metricName}`, {
      value,
      ...properties,
    });
  }

  // ---------------------------------------------------------------------------
  // Homepage analytics
  // ---------------------------------------------------------------------------

  homepageSectionViewed(
    sectionId: string,
    sectionName: string,
    properties?: EventProperties
  ): void {
    this.track('homepage_section_viewed', {
      sectionId,
      sectionName,
      ...properties,
    });
  }

  homepageSectionScrolled(
    sectionId: string,
    scrollDepth: number,
    properties?: EventProperties
  ): void {
    this.track('homepage_section_scrolled', {
      sectionId,
      scrollDepth,
      ...properties,
    });
  }

  homepageHeroSlideViewed(
    slideIndex: number,
    contentId: string,
    properties?: EventProperties
  ): void {
    this.track('homepage_hero_slide_viewed', {
      slideIndex,
      contentId,
      ...properties,
    });
  }

  homepageHeroSlideClicked(
    slideIndex: number,
    contentId: string,
    properties?: EventProperties
  ): void {
    this.track('homepage_hero_slide_clicked', {
      slideIndex,
      contentId,
      ...properties,
    });
  }

  homepageCardClicked(
    sectionId: string,
    contentId: string,
    position: number,
    properties?: EventProperties
  ): void {
    this.track('homepage_card_clicked', {
      sectionId,
      contentId,
      position,
      ...properties,
    });
  }

  homepageSectionTimeSpent(
    sectionId: string,
    timeSpentMs: number,
    properties?: EventProperties
  ): void {
    this.track('homepage_section_time_spent', {
      sectionId,
      timeSpentMs,
      ...properties,
    });
  }

  homepageVersionServed(isAuthenticated: boolean, properties?: EventProperties): void {
    this.track('homepage_version_served', {
      isAuthenticated,
      ...properties,
    });
  }

  homepageAccessed(path: string, isAuthenticated: boolean, properties?: EventProperties): void {
    this.track('homepage_accessed', {
      path,
      isAuthenticated,
      ...properties,
    });
  }

  homepageRedirected(from: string, to: string, reason: string, properties?: EventProperties): void {
    this.track('homepage_redirected', {
      from,
      to,
      reason,
      ...properties,
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export const analytics = new Analytics();

export default analytics;
