import { v4 as uuidv4 } from 'uuid';

interface AnalyticsConfig {
  endpoint: string;
  enabled: boolean;
  debug: boolean;
}

interface EventEnvelope {
  user_id: string;
  session_id: string;
  platform: 'mobile' | 'web' | 'admin';
  universe: string;
  content_id?: string;
  timestamp: string;
  device_info: {
    device_id: string;
    device_type: string;
    os_version: string;
    app_version: string;
  };
  experiment_flags?: Record<string, string>;
}

interface AnalyticsEvent {
  type: string;
  metadata?: Record<string, unknown>;
}

class Analytics {
  private config: AnalyticsConfig;
  private userId: string;
  private sessionId: string;
  private platform: 'mobile' | 'web' | 'admin';
  private appVersion: string;
  private deviceInfo: EventEnvelope['device_info'];

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.userId = this.generateUserId();
    this.sessionId = uuidv4();
    this.platform = this.getPlatform();
    this.appVersion = process.env.APP_VERSION || '1.0.0';
    this.deviceInfo = this.getDeviceInfo();
  }

  private generateUserId(): string {
    if (typeof window === 'undefined') {
      return this.sessionId || uuidv4();
    }
    const storedId = localStorage.getItem('analytics_user_id');
    if (storedId) return storedId;

    const newId = uuidv4();
    localStorage.setItem('analytics_user_id', newId);
    return newId;
  }

  private getPlatform(): 'mobile' | 'web' | 'admin' {
    if (typeof navigator === 'undefined') return 'web';
    if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) return 'mobile';
    return 'web';
  }

  private getDeviceInfo(): EventEnvelope['device_info'] {
    return {
      device_id: this.userId,
      device_type: this.platform === 'mobile' ? 'mobile' : 'desktop',
      os_version: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      app_version: this.appVersion,
    };
  }

  track(eventType: string, metadata?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      type: eventType,
      metadata: {
        ...metadata,
        user_id: this.userId,
        session_id: this.sessionId,
        platform: this.platform,
        timestamp: new Date().toISOString(),
      },
    };

    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[Analytics] Tracking event:', event);
    }

    this.sendEvent(event);
  }

  screen(screenName: string, metadata?: Record<string, unknown>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...metadata,
    });
  }

  setUser(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_user_id', userId);
    }
  }

  setUniverse(universe: string): void {
    this.universe = universe;
  }

  setExperimentFlags(flags: Record<string, string>): void {
    this.experimentFlags = flags;
  }

  private universe = 'reality';
  private experimentFlags: Record<string, string> = {};

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.config.enabled) return;

    const envelope: EventEnvelope = {
      user_id: this.userId,
      session_id: this.sessionId,
      platform: this.platform,
      universe: this.universe,
      timestamp: new Date().toISOString(),
      device_info: this.deviceInfo,
      experiment_flags: this.experimentFlags,
    };

    const payload = {
      ...event,
      metadata: {
        ...event.metadata,
        ...envelope,
      },
    };

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (this.config.debug) {
        // eslint-disable-next-line no-console
        console.error('[Analytics] Failed to send event:', error);
      }
    }
  }
}

const analytics = new Analytics({
  endpoint: process.env.ANALYTICS_ENDPOINT || '/api/analytics/events',
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV !== 'production',
});

export { analytics, Analytics, AnalyticsConfig, EventEnvelope, AnalyticsEvent };
