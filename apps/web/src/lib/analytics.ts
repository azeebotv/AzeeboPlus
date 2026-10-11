import { Analytics as AzeeboAnalytics, ConsentCategory } from '@azeebo/analytics-sdk';
import { webLogger } from '@/lib/logger';
import { hasConsent } from '@/lib/consent';

type EventProperties = Record<string, unknown>;

// AUD-07: non-essential consent starts OFF. The cookie banner's stored choice
// (lib/consent.ts) is the single source of truth — it is pushed into the SDK
// on load below and re-pushed by the banner on every save, so collection runs
// only while an explicit opt-in exists. The SDK double-checks per event
// (ConsentManager), so even a desynced state cannot leak events.
const sdk = new AzeeboAnalytics({
  enabled: process.env.NODE_ENV !== 'test',
  defaultConsent: {
    essential: true,
    analytics: false,
    marketing: false,
  },
  // AUD-45: deliver consent-gated batches to this app's own ingest relay
  // (api/v1/analytics/events), which re-verifies the consent cookie
  // server-side before forwarding to the analytics service. Client sampling
  // stays off — the bootstrap endpoint lives on the analytics service and
  // web gating is consent-only.
  endpoint: '/api',
  clientSampling: false,
});

/**
 * Push the banner's stored choice into the analytics SDK. Called on load
 * (reconciling any legacy SDK-local state with the banner) and exported for
 * the CookieConsent banner to call the moment the user saves a new choice —
 * accept starts collection, decline stops it, no page reload required.
 */
export function applyAnalyticsConsent(analyticsGranted: boolean, marketingGranted: boolean): void {
  sdk.setConsent(ConsentCategory.ANALYTICS, analyticsGranted);
  sdk.setConsent(ConsentCategory.MARKETING, marketingGranted);
}

// Reconcile SDK state with the banner on load — deny-by-default on the
// server and for first-time visitors (no stored choice ⇒ false).
applyAnalyticsConsent(hasConsent('analytics'), hasConsent('marketing'));

class Analytics {
  private userId: string | null = null;

  /**
   * Search terms can be special-category data (health, religion, sexuality),
   * so only a truncated, hashed form of a query is ever queued. djb2 keeps
   * cardinality for funnel analysis without retaining the raw text.
   */
  private hashQuery(query: string): string {
    const trimmed = query.trim().slice(0, 120);
    let hash = 5381;
    for (let i = 0; i < trimmed.length; i++) {
      hash = ((hash << 5) + hash + trimmed.charCodeAt(i)) >>> 0;
    }
    return `h${hash.toString(36)}.${trimmed.length}`;
  }

  /** Strip direct identifiers from outgoing event payloads. */
  private sanitizeProps(properties?: EventProperties): EventProperties | undefined {
    if (!properties) return properties;
    const clean: EventProperties = { ...properties };
    if (typeof clean.query === 'string') clean.query = this.hashQuery(clean.query);
    delete clean.transactionId;
    return clean;
  }

  private track(eventName: string, properties?: EventProperties): void {
    // AUD-07 defense-in-depth: without the banner's analytics opt-in, don't
    // even queue the event (the SDK performs the same check per event).
    if (!hasConsent('analytics')) return;

    if (process.env.NODE_ENV === 'development') {
      webLogger.log(`[Analytics] ${eventName}`, properties);
    }

    sdk.track({
      name: eventName,
      properties: {
        ...this.sanitizeProps(properties),
        userId: this.userId ?? undefined,
        environment: process.env.NODE_ENV,
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
    sdk.setUser({ userId });
  }

  clearUser(): void {
    this.userId = null;
    sdk.clearUser();
  }

  pageView(page: string, properties?: EventProperties): void {
    this.track('page_view', { page, ...properties });
  }

  userSignedUp(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_signup_viewed', { method, ...properties });
  }

  userSignupSubmitted(
    method: 'email' | 'google' | 'apple',
    data: Record<string, unknown>,
    properties?: EventProperties
  ): void {
    this.track('user_signup_submitted', { method, data: Object.keys(data), ...properties });
  }

  userSignupCompleted(
    userId: string,
    method: 'email' | 'google' | 'apple',
    properties?: EventProperties
  ): void {
    this.track('user_signup_completed', { userId, method, ...properties });
    this.setUserId(userId);
  }

  userSignupFailed(
    method: 'email' | 'google' | 'apple',
    error: string,
    properties?: EventProperties
  ): void {
    this.track('user_signup_failed', { method, error, ...properties });
  }

  userLoggedIn(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_login_viewed', { method, ...properties });
  }

  userLoginSubmitted(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_login_submitted', { method, ...properties });
  }

  userLoginCompleted(
    userId: string,
    method: 'email' | 'google' | 'apple',
    properties?: EventProperties
  ): void {
    this.track('user_login_completed', { userId, method, ...properties });
    this.setUserId(userId);
  }

  userLoginFailed(
    method: 'email' | 'google' | 'apple',
    error: string,
    properties?: EventProperties
  ): void {
    this.track('user_login_failed', { method, error, ...properties });
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
    this.track('content_search_viewed', { query, ...properties });
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
    this.track('content_search_completed', { query, resultsCount, ...properties });
  }

  contentSearchFailed(query: string, error: string, properties?: EventProperties): void {
    this.track('content_search_failed', { query, error, ...properties });
  }

  /** The 'did you mean' banner was displayed for a fuzzy search whose top
   * match was a typo-correction. Pairs with contentSearchCorrectionAccepted to
   * compute the correction acceptance rate. */
  contentSearchCorrectionShown(
    query: string,
    suggestedQuery: string,
    properties?: EventProperties
  ): void {
    this.track('content_search_correction_shown', { query, suggestedQuery, ...properties });
  }

  /** The user clicked the 'did you mean' banner, accepting the correction
   * (i.e. re-running the search with the suggested title). */
  contentSearchCorrectionAccepted(
    query: string,
    suggestedQuery: string,
    properties?: EventProperties
  ): void {
    this.track('content_search_correction_accepted', { query, suggestedQuery, ...properties });
  }

  contentViewed(
    contentId: string,
    contentType: string,
    title: string,
    universe: string,
    properties?: EventProperties
  ): void {
    this.track('content_viewed', { contentId, contentType, title, universe, ...properties });
  }

  contentPlayStarted(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('play_start', { contentId, contentType, ...properties });
  }

  contentPlayCompleted(
    contentId: string,
    contentType: string,
    watchDuration: number,
    properties?: EventProperties
  ): void {
    this.track('play_complete', { contentId, contentType, watchDuration, ...properties });
  }

  contentPlayFailed(
    contentId: string,
    contentType: string,
    error: string,
    properties?: EventProperties
  ): void {
    this.track('content_play_failed', { contentId, contentType, error, ...properties });
  }

  contentPaused(
    contentId: string,
    contentType: string,
    pausedAt: number,
    properties?: EventProperties
  ): void {
    this.track('content_paused', { contentId, contentType, pausedAt, ...properties });
  }

  contentSaved(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_saved', { contentId, contentType, ...properties });
  }

  contentShared(
    contentId: string,
    contentType: string,
    shareMethod: 'copy_link' | 'twitter' | 'facebook' | 'email',
    properties?: EventProperties
  ): void {
    this.track('content_shared', { contentId, contentType, shareMethod, ...properties });
  }

  contentLiked(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_liked', { contentId, contentType, ...properties });
  }

  contentCommented(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_commented', { contentId, contentType, ...properties });
  }

  paymentViewed(
    amount: number,
    currency: string,
    paymentMethod: string,
    properties?: EventProperties
  ): void {
    this.track('payment_viewed', { amount, currency, paymentMethod, ...properties });
  }

  paymentSubmitted(
    amount: number,
    currency: string,
    paymentMethod: string,
    properties?: EventProperties
  ): void {
    this.track('payment_submitted', { amount, currency, paymentMethod, ...properties });
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
    this.track('payment_failed', { amount, currency, paymentMethod, error, ...properties });
  }

  walletFunded(
    amount: number,
    currency: string,
    fundingSource: string,
    properties?: EventProperties
  ): void {
    this.track('wallet_funded', { amount, currency, fundingSource, ...properties });
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
    this.track('wallet_withdrawal_completed', { amount, currency, transactionId, ...properties });
  }

  subscriptionStarted(
    planId: string,
    planName: string,
    billingCycle: 'monthly' | 'yearly',
    properties?: EventProperties
  ): void {
    this.track('subscription_started', { planId, planName, billingCycle, ...properties });
  }

  subscriptionCancelled(
    planId: string,
    planName: string,
    reason?: string,
    properties?: EventProperties
  ): void {
    this.track('subscription_cancelled', { planId, planName, reason, ...properties });
  }

  subscriptionRenewed(
    planId: string,
    planName: string,
    billingCycle: 'monthly' | 'yearly',
    properties?: EventProperties
  ): void {
    this.track('subscription_renewed', { planId, planName, billingCycle, ...properties });
  }

  rewardEarned(
    rewardType: string,
    amount: number,
    reason: string,
    properties?: EventProperties
  ): void {
    this.track('reward_earned', { rewardType, amount, reason, ...properties });
  }

  rewardRedeemed(
    rewardType: string,
    amount: number,
    redeemedFor: string,
    properties?: EventProperties
  ): void {
    this.track('reward_redeemed', { rewardType, amount, redeemedFor, ...properties });
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
    this.track('content_upload_completed', { contentId, contentType, ...properties });
  }

  contentUploadFailed(contentType: string, error: string, properties?: EventProperties): void {
    this.track('content_upload_failed', { contentType, error, ...properties });
  }

  errorOccurred(error: string, context: string, properties?: EventProperties): void {
    this.track('error_occurred', { error, context, ...properties });
  }

  performanceMetric(metricName: string, value: number, properties?: EventProperties): void {
    this.track(`performance_${metricName}`, { value, ...properties });
  }

  homepageSectionViewed(
    sectionId: string,
    sectionName: string,
    properties?: EventProperties
  ): void {
    this.track('homepage_section_viewed', { sectionId, sectionName, ...properties });
  }

  homepageSectionScrolled(
    sectionId: string,
    scrollDepth: number,
    properties?: EventProperties
  ): void {
    this.track('homepage_section_scrolled', { sectionId, scrollDepth, ...properties });
  }

  homepageHeroSlideViewed(
    slideIndex: number,
    contentId: string,
    properties?: EventProperties
  ): void {
    this.track('homepage_hero_slide_viewed', { slideIndex, contentId, ...properties });
  }

  homepageHeroSlideClicked(
    slideIndex: number,
    contentId: string,
    properties?: EventProperties
  ): void {
    this.track('homepage_hero_slide_clicked', { slideIndex, contentId, ...properties });
  }

  homepageCardClicked(
    sectionId: string,
    contentId: string,
    position: number,
    properties?: EventProperties
  ): void {
    this.track('homepage_card_clicked', { sectionId, contentId, position, ...properties });
  }

  homepageSectionTimeSpent(
    sectionId: string,
    timeSpentMs: number,
    properties?: EventProperties
  ): void {
    this.track('homepage_section_time_spent', { sectionId, timeSpentMs, ...properties });
  }

  homepageVersionServed(isAuthenticated: boolean, properties?: EventProperties): void {
    this.track('homepage_version_served', { isAuthenticated, ...properties });
  }

  homepageAccessed(path: string, isAuthenticated: boolean, properties?: EventProperties): void {
    this.track('homepage_accessed', { path, isAuthenticated, ...properties });
  }

  homepageRedirected(from: string, to: string, reason: string, properties?: EventProperties): void {
    this.track('homepage_redirected', { from, to, reason, ...properties });
  }

  /** Global nav interactions (header links, cart, universe dropdown). */
  navClicked(params: {
    label: string;
    href: string;
    position: 'header' | 'mobile' | 'footer';
  }): void {
    this.track('nav_clicked', params);
  }
}

export const analytics = new Analytics();

export default analytics;
