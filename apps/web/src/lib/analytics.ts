/* eslint-disable @typescript-eslint/no-explicit-any */

type EventName = string;
type EventProperties = Record<string, unknown>;

interface AnalyticsEvent {
  name: EventName;
  properties?: EventProperties;
  timestamp: Date;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';

  private track(eventName: EventName, properties?: EventProperties): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date(),
    };

    this.events.push(event);

    if (this.isDevelopment) {
      // Development logging is intentionally done via console
    }
  }

  pageView(page: string, properties?: EventProperties): void {
    this.track('page_view', {
      page,
      ...properties,
    });

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
        page_path: page,
        ...properties,
      });
    }
  }

  userAction(action: string, properties?: EventProperties): void {
    this.track(`user_action_${action}`, properties);
  }

  contentViewed(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_viewed', {
      contentId,
      contentType,
      ...properties,
    });
  }

  contentStarted(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_started', {
      contentId,
      contentType,
      ...properties,
    });
  }

  contentCompleted(contentId: string, contentType: string, properties?: EventProperties): void {
    this.track('content_completed', {
      contentId,
      contentType,
      ...properties,
    });
  }

  userSignedUp(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_signed_up', {
      method,
      ...properties,
    });
  }

  userLoggedIn(method: 'email' | 'google' | 'apple', properties?: EventProperties): void {
    this.track('user_logged_in', {
      method,
      ...properties,
    });
  }

  paymentInitiated(amount: number, currency: string, properties?: EventProperties): void {
    this.track('payment_initiated', {
      amount,
      currency,
      ...properties,
    });
  }

  paymentCompleted(amount: number, currency: string, properties?: EventProperties): void {
    this.track('payment_completed', {
      amount,
      currency,
      ...properties,
    });
  }

  paymentFailed(error: string, properties?: EventProperties): void {
    this.track('payment_failed', {
      error,
      ...properties,
    });
  }

  searchPerformed(query: string, resultsCount: number, properties?: EventProperties): void {
    this.track('search_performed', {
      query,
      resultsCount,
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

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const analytics = new Analytics();

export default analytics;
