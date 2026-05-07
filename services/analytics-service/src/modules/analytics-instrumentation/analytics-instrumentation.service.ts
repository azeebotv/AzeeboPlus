import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  sessionId?: string;
  platform?: 'web' | 'mobile' | 'tablet';
  universe?: string;
  timestamp?: Date;
  deviceInfo?: {
    deviceType?: string;
    os?: string;
    osVersion?: string;
    browser?: string;
    browserVersion?: string;
    appVersion?: string;
    screenWidth?: number;
    screenHeight?: number;
    language?: string;
    timezone?: string;
    userAgent?: string;
  };
  appVersion?: string;
  experimentFlags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export const EVENT_NAMES = {
  SCREEN_VIEW: 'screen_view',
  CONTENT_IMPRESSION: 'content_impression',
  CONTENT_CLICK: 'content_click',
  PLAY_START: 'play_start',
  PLAY_COMPLETE: 'play_complete',
  LOGIN: 'login',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SIGNUP: 'signup',
  SIGNUP_COMPLETED: 'signup_completed',
  VOTE: 'vote',
  VOTE_SUBMITTED: 'vote_submitted',
  PAYMENT_VIEWED: 'payment_viewed',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  REWARD_EARNED: 'reward_earned',
  REWARD_REDEEMED: 'reward_redeemed',
  CREATOR_FOLLOW: 'creator_follow',
  CREATOR_UNFOLLOW: 'creator_unfollow',
  TIP_SENT: 'tip_sent',
  TIP_RECEIVED: 'tip_received',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PREDICTION_PLACED: 'prediction_placed',
  PREDICTION_WON: 'prediction_won',
  PREDICTION_LOST: 'prediction_lost',
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  GAME_ANSWERED: 'game_answered',
  SHARE: 'share',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',
  SEARCH_PERFORMED: 'search_performed',
  CONTENT_SAVED: 'content_saved',
  CONTENT_SHARED: 'content_shared',
} as const;

@Injectable()
export class AnalyticsInstrumentationService {
  constructor(private prisma: PrismaService) {}

  async track(event: AnalyticsEvent): Promise<{ id: string }> {
    const eventRecord = await this.prisma.productEvent.create({
      data: {
        eventName: event.eventName,
        userId: event.userId,
        sessionId: event.sessionId,
        platform: event.platform,
        universe: event.universe,
        timestamp: event.timestamp || new Date(),
        appVersion: event.appVersion,
        experimentFlags: event.experimentFlags as Record<string, string> | null,
        metadata: event.metadata as Record<string, string | number | boolean | null> | null,
      },
    });

    if (event.deviceInfo) {
      await this.prisma.deviceInfo.create({
        data: {
          productEventId: eventRecord.id,
          deviceType: event.deviceInfo.deviceType,
          os: event.deviceInfo.os,
          osVersion: event.deviceInfo.osVersion,
          browser: event.deviceInfo.browser,
          browserVersion: event.deviceInfo.browserVersion,
          appVersion: event.deviceInfo.appVersion,
          screenWidth: event.deviceInfo.screenWidth,
          screenHeight: event.deviceInfo.screenHeight,
          language: event.deviceInfo.language,
          timezone: event.deviceInfo.timezone,
          userAgent: event.deviceInfo.userAgent,
        },
      });
    }

    return { id: eventRecord.id };
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<{ ingested: number }> {
    const results = await this.prisma.$transaction(
      events.map((event) =>
        this.prisma.productEvent.create({
          data: {
            eventName: event.eventName,
            userId: event.userId,
            sessionId: event.sessionId,
            platform: event.platform,
            universe: event.universe,
            timestamp: event.timestamp || new Date(),
            appVersion: event.appVersion,
            experimentFlags: event.experimentFlags as Record<string, string> | null,
            metadata: event.metadata as Record<string, string | number | boolean | null> | null,
          },
        })
      )
    );
    return { ingested: results.length };
  }

  async trackScreenView(
    userId: string,
    sessionId: string,
    screenName: string,
    platform: 'web' | 'mobile' | 'tablet',
    metadata?: Record<string, unknown>
  ): Promise<{ id: string }> {
    return this.track({
      eventName: EVENT_NAMES.SCREEN_VIEW,
      userId,
      sessionId,
      platform,
      metadata: { screenName, ...metadata },
    });
  }

  async trackContentImpression(
    userId: string,
    sessionId: string,
    contentId: string,
    contentType: string,
    universe: string,
    platform: 'web' | 'mobile' | 'tablet'
  ): Promise<{ id: string }> {
    return this.track({
      eventName: EVENT_NAMES.CONTENT_IMPRESSION,
      userId,
      sessionId,
      platform,
      universe,
      metadata: { contentId, contentType },
    });
  }

  async trackPayment(
    userId: string,
    sessionId: string,
    eventType: 'viewed' | 'initiated' | 'success' | 'failed',
    amount: number,
    currency: string,
    paymentMethod?: string,
    errorMessage?: string
  ): Promise<{ id: string }> {
    const eventNameMap = {
      viewed: EVENT_NAMES.PAYMENT_VIEWED,
      initiated: EVENT_NAMES.PAYMENT_INITIATED,
      success: EVENT_NAMES.PAYMENT_SUCCESS,
      failed: EVENT_NAMES.PAYMENT_FAILED,
    };

    return this.track({
      eventName: eventNameMap[eventType],
      userId,
      sessionId,
      platform: 'web',
      metadata: {
        amount,
        currency,
        paymentMethod,
        errorMessage,
      },
    });
  }

  async trackReward(
    userId: string,
    eventType: 'earned' | 'redeemed',
    rewardType: string,
    amount: number,
    universe?: string
  ): Promise<{ id: string }> {
    const eventName =
      eventType === 'earned' ? EVENT_NAMES.REWARD_EARNED : EVENT_NAMES.REWARD_REDEEMED;
    return this.track({
      eventName,
      userId,
      universe,
      metadata: { rewardType, amount },
    });
  }

  async trackGameEvent(
    userId: string,
    sessionId: string,
    eventType: 'started' | 'completed' | 'answered',
    gameId: string,
    metadata?: Record<string, unknown>
  ): Promise<{ id: string }> {
    const eventNameMap = {
      started: EVENT_NAMES.GAME_STARTED,
      completed: EVENT_NAMES.GAME_COMPLETED,
      answered: EVENT_NAMES.GAME_ANSWERED,
    };

    return this.track({
      eventName: eventNameMap[eventType],
      userId,
      sessionId,
      universe: 'games',
      metadata: { gameId, ...metadata },
    });
  }

  async trackPrediction(
    userId: string,
    eventType: 'placed' | 'won' | 'lost',
    marketId: string,
    stake?: number,
    payout?: number
  ): Promise<{ id: string }> {
    const eventNameMap = {
      placed: EVENT_NAMES.PREDICTION_PLACED,
      won: EVENT_NAMES.PREDICTION_WON,
      lost: EVENT_NAMES.PREDICTION_LOST,
    };

    return this.track({
      eventName: eventNameMap[eventType],
      userId,
      universe: 'sports',
      metadata: { marketId, stake, payout },
    });
  }

  async trackShare(
    userId: string,
    contentId: string,
    contentType: string,
    platform: string,
    shareMethod: string
  ): Promise<{ id: string }> {
    return this.track({
      eventName: EVENT_NAMES.SHARE,
      userId,
      universe: 'social',
      metadata: { contentId, contentType, platform, shareMethod },
    });
  }
}
