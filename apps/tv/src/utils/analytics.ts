import { Analytics, ConsentCategory } from '@azeebo/analytics-sdk';
import Constants from 'expo-constants';
import { logger } from '@azeebo/react-data/utils/logger';

const constantsExtra = (
  (Constants as Record<string, unknown>).expoConfig as Record<string, unknown>
)?.extra as Record<string, unknown> | undefined;
const analyticsEndpoint =
  (constantsExtra?.analyticsEndpoint as string) || process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT || '';

const sdk = new Analytics({
  enabled: !!analyticsEndpoint && process.env.NODE_ENV !== 'test',
  debug: __DEV__,
  endpoint: analyticsEndpoint || undefined,
  flushBatchSize: 5,
  flushInterval: 15000,
  defaultConsent: {
    [ConsentCategory.ESSENTIAL]: true,
    [ConsentCategory.ANALYTICS]: true,
  },
});

/**
 * TV surface analytics. Mirrors the mobile AnalyticsService for the events
 * the TV app actually produces (sign-in, playback, funding) with
 * device_type: 'tv' so dashboards can split the surfaces.
 */
class TVAnalyticsService {
  private track(name: string, properties?: Record<string, unknown>): void {
    try {
      sdk.track({
        name,
        properties: { ...properties, device_type: 'tv' },
        category: ConsentCategory.ANALYTICS,
      });
    } catch (err: unknown) {
      if (__DEV__)
        logger.warn('[Analytics] track failed:', err instanceof Error ? err.message : String(err));
    }
  }

  userLoggedIn(method: string) {
    this.track('user_logged_in', { method });
  }

  contentWatched(contentId: string) {
    this.track('content_watched', { content_id: contentId });
  }

  walletFunded(amount: number, provider: string) {
    this.track('wallet_funded', { amount, provider });
  }

  paymentInitialized(amount: number, provider: string) {
    this.track('payment_initialized', { amount, provider, item_type: 'wallet_funding' });
  }

  paymentFailed(amount: number, provider: string, error: string) {
    this.track('payment_failed', { amount, provider, error });
  }

  setUser(userId: string) {
    sdk.setUser({ userId });
  }

  clearUser() {
    sdk.clearUser();
  }

  flush() {
    sdk.flush();
  }
}

export const analytics = new TVAnalyticsService();
export default analytics;
