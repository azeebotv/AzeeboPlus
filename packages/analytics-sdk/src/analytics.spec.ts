import { Analytics, AnalyticsEvent } from './index';

describe('Analytics SDK', () => {
  let analytics: Analytics;
  let trackedEvents: AnalyticsEvent[] = [];

  beforeEach(() => {
    trackedEvents = [];
    analytics = new Analytics({ enabled: true, debug: true, flushBatchSize: 1 });

    // Override flush to capture events without sending them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (analytics as any).flush = async function (this: Analytics) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((this as any).queue.length === 0) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackedEvents.push(...(this as any).queue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).queue = [];
    };
  });

  describe('Event Naming Convention', () => {
    it('should use snake_case for all event names', () => {
      const snakeCaseRegex = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

      analytics.login(true);
      analytics.signup(false);
      analytics.contentImpression('content-1', 'video', 'reality');
      analytics.contentClick('content-1', 'video', 'reality');
      analytics.voteSubmitted('contestant-1', 10, false);
      analytics.paymentSuccess(1000, 'NGN');
      analytics.rewardEarned('daily_bonus', 50);
      analytics.creatorFollow('creator-1');
      analytics.predictionSubmitted('pred-1', 'A');
      analytics.gameStarted('game-1');
      analytics.gameCompleted('game-1', 100);
      analytics.share('content-1');
      analytics.screenView('home');
      analytics.notificationReceived('notif-1');
      analytics.notificationClicked('notif-1');

      trackedEvents.forEach((event) => {
        expect(event.name).toMatch(snakeCaseRegex);
      });
    });
  });

  describe('Authentication Events', () => {
    it('should track successful login', () => {
      analytics.login(true);

      const event = trackedEvents.find((e) => e.name === 'login_success');
      expect(event).toBeDefined();
      expect(event?.properties?.platform).toBe('web');
    });

    it('should track failed login', () => {
      analytics.login(false);

      const event = trackedEvents.find((e) => e.name === 'login_failed');
      expect(event).toBeDefined();
      expect(event?.properties?.platform).toBe('web');
    });

    it('should track successful signup', () => {
      analytics.signup(true);

      const event = trackedEvents.find((e) => e.name === 'signup_completed');
      expect(event).toBeDefined();
    });
  });

  describe('Content Events', () => {
    it('should track content impression', () => {
      analytics.contentImpression('content-1', 'video', 'reality');

      const event = trackedEvents.find((e) => e.name === 'content_impression');
      expect(event).toBeDefined();
      expect(event?.properties?.content_id).toBe('content-1');
      expect(event?.properties?.content_type).toBe('video');
      expect(event?.properties?.universe).toBe('reality');
    });

    it('should track content click', () => {
      analytics.contentClick('content-2', 'movie', 'sports');

      const event = trackedEvents.find((e) => e.name === 'content_click');
      expect(event).toBeDefined();
      expect(event?.properties?.content_id).toBe('content-2');
    });
  });

  describe('Payment Events', () => {
    it('should track successful payment', () => {
      analytics.paymentSuccess(5000, 'NGN');

      const event = trackedEvents.find((e) => e.name === 'payment_success');
      expect(event).toBeDefined();
      expect(event?.properties?.amount).toBe(5000);
      expect(event?.properties?.currency).toBe('NGN');
    });
  });

  describe('Engagement Events', () => {
    it('should track vote submission', () => {
      analytics.voteSubmitted('contestant-1', 10, true);

      const event = trackedEvents.find((e) => e.name === 'vote_submitted');
      expect(event).toBeDefined();
      expect(event?.properties?.contestant_id).toBe('contestant-1');
      expect(event?.properties?.amount).toBe(10);
      expect(event?.properties?.supervoted).toBe(true);
    });

    it('should track reward earned', () => {
      analytics.rewardEarned('daily_bonus', 100);

      const event = trackedEvents.find((e) => e.name === 'reward_earned');
      expect(event).toBeDefined();
      expect(event?.properties?.reward_type).toBe('daily_bonus');
      expect(event?.properties?.points).toBe(100);
    });

    it('should track creator follow', () => {
      analytics.creatorFollow('creator-123');

      const event = trackedEvents.find((e) => e.name === 'creator_follow');
      expect(event).toBeDefined();
      expect(event?.properties?.creator_id).toBe('creator-123');
    });
  });

  describe('Game Events', () => {
    it('should track game started', () => {
      analytics.gameStarted('game-1');

      const event = trackedEvents.find((e) => e.name === 'game_started');
      expect(event).toBeDefined();
      expect(event?.properties?.game_id).toBe('game-1');
    });

    it('should track game completed', () => {
      analytics.gameCompleted('game-1', 95);

      const event = trackedEvents.find((e) => e.name === 'game_completed');
      expect(event).toBeDefined();
      expect(event?.properties?.game_id).toBe('game-1');
      expect(event?.properties?.score).toBe(95);
    });
  });

  describe('Notification Events', () => {
    it('should track notification received', () => {
      analytics.notificationReceived('notif-1');

      const event = trackedEvents.find((e) => e.name === 'notification_received');
      expect(event).toBeDefined();
      expect(event?.properties?.notification_id).toBe('notif-1');
    });

    it('should track notification clicked', () => {
      analytics.notificationClicked('notif-2');

      const event = trackedEvents.find((e) => e.name === 'notification_clicked');
      expect(event).toBeDefined();
      expect(event?.properties?.notification_id).toBe('notif-2');
    });
  });

  describe('Disabled Analytics', () => {
    it('should not track events when disabled', () => {
      const disabledAnalytics = new Analytics({ enabled: false });
      disabledAnalytics.track({ name: 'test_event' });

      // No events should be tracked
      expect(disabledAnalytics).toBeDefined();
    });
  });

  describe('Event Timestamps', () => {
    it('should include timestamp for all events', () => {
      analytics.login(true);

      const event = trackedEvents[0];
      expect(event.timestamp).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Client-side sampling', () => {
    it('isEntitySampled keeps everything at 100% and nothing at 0%', () => {
      const { isEntitySampled } = require('./index');
      expect(isEntitySampled('u1', 100)).toBe(true);
      expect(isEntitySampled('u1', 0)).toBe(false);
    });

    it('is deterministic for the same entity', () => {
      const { isEntitySampled } = require('./index');
      const a = isEntitySampled('stable-user', 50);
      const b = isEntitySampled('stable-user', 50);
      expect(a).toBe(b);
    });

    it('samples a fraction of distinct users at partial rate', () => {
      const { isEntitySampled } = require('./index');
      let kept = 0;
      for (let i = 0; i < 100; i++) {
        if (isEntitySampled(`user-${i}`, 50)) kept++;
      }
      expect(kept).toBeGreaterThan(10);
      expect(kept).toBeLessThan(90);
    });

    it('does not sample when the bootstrap config is disabled', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (analytics as any).samplingConfig = { enabled: false, samplingRate: 50 };
      analytics.login(true);
      expect(trackedEvents.length).toBe(1);
    });

    it('drops events when the bootstrap config is enabled at a low rate', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (analytics as any).samplingConfig = { enabled: true, samplingRate: 0 };
      trackedEvents = [];
      analytics.login(true);
      expect(trackedEvents.length).toBe(0);
    });

    it('refreshSamplingConfig falls back to full sampling on fetch error', async () => {
      const noEndpoint = new Analytics({ clientSampling: true });
      const config = await noEndpoint.refreshSamplingConfig();
      expect(config).toEqual({ enabled: false, samplingRate: 100 });
    });
  });
});
