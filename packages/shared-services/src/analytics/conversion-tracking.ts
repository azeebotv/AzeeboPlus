/**
 * Conversion Tracking Events
 * AN-006: Track key business metrics (signup, purchase, retention)
 */

export type ConversionEvent =
  | { type: 'signup_started'; channel?: string }
  | { type: 'signup_completed'; userId: string; plan?: string }
  | { type: 'email_verified'; userId: string }
  | { type: 'onboarding_completed'; userId: string; stepsCompleted: number }
  | { type: 'first_content_view'; userId: string; contentId: string; contentType: string }
  | { type: 'subscription_started'; userId: string; plan: string; amount: number; currency: string }
  | { type: 'subscription_cancelled'; userId: string; plan: string; reason?: string }
  | { type: 'subscription_renewed'; userId: string; plan: string; amount: number }
  | { type: 'payment_completed'; userId: string; amount: number; currency: string; method: string }
  | { type: 'payment_failed'; userId: string; amount: number; currency: string; errorCode: string }
  | { type: 'content_created'; userId: string; contentType: string }
  | { type: 'content_published'; userId: string; contentType: string }
  | { type: 'creator_applied'; userId: string; category: string }
  | { type: 'creator_approved'; userId: string }
  | { type: 'vote_cast'; userId: string; contestId: string; type: 'regular' | 'super' }
  | { type: 'referral_sent'; userId: string; channel: string }
  | { type: 'referral_completed'; referrerId: string; referredId: string }
  | { type: 'app_installed'; platform: 'ios' | 'android'; source?: string }
  | { type: 'push_notification_opt_in'; userId: string }
  | { type: 'session_started'; userId?: string; platform: string; isNewUser: boolean }
  | { type: 'session_ended'; userId?: string; durationMs: number; pagesViewed: number };

// Funnel definitions for analytics
export const CONVERSION_FUNNELS = {
  signup: {
    name: 'User Signup',
    steps: ['signup_started', 'email_verified', 'onboarding_completed'],
  },
  subscription: {
    name: 'Subscription',
    steps: ['subscription_started'],
  },
  payment: {
    name: 'Payment',
    steps: ['payment_completed'],
  },
  creator: {
    name: 'Creator Onboarding',
    steps: ['creator_applied', 'creator_approved', 'content_created', 'content_published'],
  },
  retention: {
    name: 'User Retention',
    steps: ['session_started', 'first_content_view'],
    trackDays: [1, 3, 7, 14, 30, 60, 90],
  },
} as const;

// KPI definitions
export const BUSINESS_KPIS = {
  northStar: { name: 'Weekly Active Creators', metric: 'unique_creators_active_7d' },
  acquisition: {
    metrics: [
      'signups_daily',
      'signup_to_verified_rate',
      'app_installs_daily',
      'referral_rate',
    ],
  },
  activation: {
    metrics: [
      'onboarding_completion_rate',
      'first_content_view_rate',
      'time_to_first_value_seconds',
    ],
  },
  revenue: {
    metrics: [
      'mrr',
      'arr',
      'arpu',
      'ltv',
      'ltv_to_cac_ratio',
      'churn_rate_monthly',
      'subscription_conversion_rate',
    ],
  },
  engagement: {
    metrics: [
      'dau',
      'mau',
      'dau_mau_ratio',
      'avg_session_duration_seconds',
      'content_views_per_session',
      'votes_per_active_user',
    ],
  },
  retention: {
    metrics: [
      'retention_d1',
      'retention_d7',
      'retention_d30',
      'churn_rate_weekly',
      'reactivation_rate',
    ],
  },
} as const;
