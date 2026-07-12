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
export declare const AnalyticsEvents: {
  AUTH_LOGIN_VIEWED: EventName;
  AUTH_LOGIN_SUBMITTED: EventName;
  AUTH_LOGIN_COMPLETED: EventName;
  AUTH_LOGIN_FAILED: EventName;
  AUTH_REGISTER_VIEWED: EventName;
  AUTH_REGISTER_SUBMITTED: EventName;
  AUTH_REGISTER_COMPLETED: EventName;
  AUTH_REGISTER_FAILED: EventName;
  AUTH_LOGOUT_COMPLETED: EventName;
  PAYMENT_VIEWED: EventName;
  PAYMENT_SUBMITTED: EventName;
  PAYMENT_COMPLETED: EventName;
  PAYMENT_FAILED: EventName;
  REFUND_REQUESTED: EventName;
  REFUND_COMPLETED: EventName;
  REFUND_FAILED: EventName;
  CONTENT_VIEWED: EventName;
  CONTENT_LIKED: EventName;
  CONTENT_SHARED: EventName;
  CONTENT_COMMENTED: EventName;
  CREATOR_TIPPED: EventName;
  CREATOR_SUBSCRIBED: EventName;
  CREATOR_UNSUBSCRIBED: EventName;
  USER_PROFILE_VIEWED: EventName;
  USER_PROFILE_UPDATED: EventName;
  USER_SETTINGS_VIEWED: EventName;
  USER_SETTINGS_UPDATED: EventName;
  UNIVERSE_ENTERED: EventName;
  UNIVERSE_EXITED: EventName;
  UNIVERSE_CREATED: EventName;
  CHALLENGE_VIEWED: EventName;
  CHALLENGE_SUBMITTED: EventName;
  CHALLENGE_WON: EventName;
  CHALLENGE_LOST: EventName;
  REWARD_CLAIMED: EventName;
  REWARD_EARNED: EventName;
  WALLET_VIEWED: EventName;
  WALLET_DEPOSITED: EventName;
  WALLET_WITHDRAWN: EventName;
  WALLET_TRANSFERRED: EventName;
};
export declare class AnalyticsService {
  private readonly logger;
  track(event: AnalyticsEvent): void;
  trackView(action: string, userId: string): void;
  trackSubmit(action: string, userId: string, data?: Record<string, unknown>): void;
  trackCompleted(action: string, userId: string, result?: Record<string, unknown>): void;
  trackFailed(action: string, userId: string, error?: string): void;
  private validateEventName;
  private sendToAnalytics;
}
