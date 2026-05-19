import { Injectable, Logger } from '@nestjs/common';

export type EventName = 
  | `${string}_viewed`
  | `${string}_submitted`
  | `${string}_completed`
  | `${string}_failed`
  | `${string}_started`
  | `${string}_ended`
  | `${string}_clicked`
  | `${string}_shared`
  | `${string}_liked`
  | `${string}_created`
  | `${string}_updated`
  | `${string}_deleted`;

export interface AnalyticsEvent {
  name: EventName;
  userId: string;
  timestamp: Date;
  properties?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export const AnalyticsEvents = {
  // Authentication Events
  AUTH_LOGIN_VIEWED: 'auth_login_viewed' as EventName,
  AUTH_LOGIN_SUBMITTED: 'auth_login_submitted' as EventName,
  AUTH_LOGIN_COMPLETED: 'auth_login_completed' as EventName,
  AUTH_LOGIN_FAILED: 'auth_login_failed' as EventName,
  
  AUTH_REGISTER_VIEWED: 'auth_register_viewed' as EventName,
  AUTH_REGISTER_SUBMITTED: 'auth_register_submitted' as EventName,
  AUTH_REGISTER_COMPLETED: 'auth_register_completed' as EventName,
  AUTH_REGISTER_FAILED: 'auth_register_failed' as EventName,

  AUTH_LOGOUT_COMPLETED: 'auth_logout_completed' as EventName,

  // Payment Events
  PAYMENT_VIEWED: 'payment_viewed' as EventName,
  PAYMENT_SUBMITTED: 'payment_submitted' as EventName,
  PAYMENT_COMPLETED: 'payment_completed' as EventName,
  PAYMENT_FAILED: 'payment_failed' as EventName,

  REFUND_REQUESTED: 'refund_requested' as EventName,
  REFUND_COMPLETED: 'refund_completed' as EventName,
  REFUND_FAILED: 'refund_failed' as EventName,

  // Content Events
  CONTENT_VIEWED: 'content_viewed' as EventName,
  CONTENT_LIKED: 'content_liked' as EventName,
  CONTENT_SHARED: 'content_shared' as EventName,
  CONTENT_COMMENTED: 'content_commented' as EventName,

  // Creator Events
  CREATOR_TIPPED: 'creator_tipped' as EventName,
  CREATOR_SUBSCRIBED: 'creator_subscribed' as EventName,
  CREATOR_UNSUBSCRIBED: 'creator_unsubscribed' as EventName,

  // User Events
  USER_PROFILE_VIEWED: 'user_profile_viewed' as EventName,
  USER_PROFILE_UPDATED: 'user_profile_updated' as EventName,
  USER_SETTINGS_VIEWED: 'user_settings_viewed' as EventName,
  USER_SETTINGS_UPDATED: 'user_settings_updated' as EventName,

  // Universe Events
  UNIVERSE_ENTERED: 'universe_entered' as EventName,
  UNIVERSE_EXITED: 'universe_exited' as EventName,
  UNIVERSE_CREATED: 'universe_created' as EventName,

  // Challenge Events
  CHALLENGE_VIEWED: 'challenge_viewed' as EventName,
  CHALLENGE_SUBMITTED: 'challenge_submitted' as EventName,
  CHALLENGE_WON: 'challenge_won' as EventName,
  CHALLENGE_LOST: 'challenge_lost' as EventName,

  // Reward Events
  REWARD_CLAIMED: 'reward_claimed' as EventName,
  REWARD_EARNED: 'reward_earned' as EventName,

  // Wallet Events
  WALLET_VIEWED: 'wallet_viewed' as EventName,
  WALLET_DEPOSITED: 'wallet_deposited' as EventName,
  WALLET_WITHDRAWN: 'wallet_withdrawn' as EventName,
  WALLET_TRANSFERRED: 'wallet_transferred' as EventName,
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  track(event: AnalyticsEvent): void {
    this.validateEventName(event.name);
    
    const eventData = {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };

    this.logger.debug(`Tracking analytics event: ${event.name}`, eventData);
    
    this.sendToAnalytics(eventData);
  }

  trackView(action: string, userId: string): void {
    const eventName = `${action}_viewed` as EventName;
    this.track({
      name: eventName,
      userId,
      timestamp: new Date(),
    });
  }

  trackSubmit(action: string, userId: string, data?: Record<string, unknown>): void {
    const eventName = `${action}_submitted` as EventName;
    this.track({
      name: eventName,
      userId,
      timestamp: new Date(),
      properties: data,
    });
  }

  trackCompleted(action: string, userId: string, result?: Record<string, unknown>): void {
    const eventName = `${action}_completed` as EventName;
    this.track({
      name: eventName,
      userId,
      timestamp: new Date(),
      properties: result,
    });
  }

  trackFailed(action: string, userId: string, error?: string): void {
    const eventName = `${action}_failed` as EventName;
    this.track({
      name: eventName,
      userId,
      timestamp: new Date(),
      properties: { error },
    });
  }

  private validateEventName(name: string): void {
    const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
    
    if (!snakeCaseRegex.test(name)) {
      this.logger.warn(`Event name "${name}" is not in snake_case format. Please use lowercase letters, numbers, and underscores only.`);
    }

    const maxLength = 100;
    if (name.length > maxLength) {
      this.logger.warn(`Event name "${name}" exceeds ${maxLength} characters.`);
    }
  }

  private sendToAnalytics(event: Record<string, unknown>): void {
    try {
      // In production, this would send to your analytics provider
      // e.g., Segment, Mixpanel, Amplitude, or internal analytics service
      this.logger.debug('[Analytics]', JSON.stringify(event));
    } catch (error) {
      this.logger.error('Failed to send analytics event:', error);
    }
  }
}