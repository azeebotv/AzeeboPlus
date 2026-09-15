/**
 * Typed flag-key registries.
 *
 * Each domain exports an `as const` map so flag keys are compile-time checked
 * across services, the admin UI can render a "known flags" reference, and
 * typos in `isEnabled('...')` calls are caught by the typechecker.
 *
 * Naming conventions (see docs/feature-flags-implementation.md):
 * - `{domain}_{feature}_enabled` — boolean kill-switch, default ON
 * - `{domain}_{feature}_v2` / new features — default OFF, percentage rollout
 */

export const walletFlags = {
  withdrawalsEnabled: 'wallet_withdrawals_enabled',
  transfersEnabled: 'wallet_transfers_enabled',
  bonusCredit: 'wallet_bonus_credit',
  promoCredit: 'wallet_promo_credit',
  redeemRewards: 'wallet_redeem_rewards',
  distributedLock: 'wallet_distributed_lock',
  ledgerV2: 'wallet_ledger_v2',
  fraudChecks: 'wallet_fraud_checks',
} as const;

export const paymentFlags = {
  providerPaystack: 'payment_provider_paystack',
  providerFlutterwave: 'payment_provider_flutterwave',
  webhooksEnabled: 'payment_webhooks_enabled',
  newCheckoutFlow: 'payment_new_checkout_flow',
  intentsApi: 'payment_intents_api',
  selfServiceRefund: 'payment_self_service_refund',
  kycRequired: 'payment_kyc_required',
  scheduledTasks: 'payment_scheduled_tasks',
} as const;

export const creatorFlags = {
  payoutsEnabled: 'creator_payouts_enabled',
  tipsEnabled: 'creator_tips_enabled',
  subscriptionsEnabled: 'creator_subscriptions_enabled',
  monetizationInsights: 'creator_monetization_insights',
  newAnalytics: 'creator_new_analytics',
  uploadV2: 'creator_upload_v2',
  payoutsUi: 'creator_payouts_ui',
  onboardingWizard: 'creator_onboarding_wizard',
} as const;

export const subscriptionFlags = {
  bundles: 'subscription_bundles',
  freeTrial: 'subscription_free_trial',
  promoDiscounts: 'subscription_promo_discounts',
  dunning: 'subscription_dunning',
  deviceLimits: 'subscription_device_limits',
} as const;

export const contentFlags = {
  moderationEnabled: 'content_moderation_enabled',
  transcodingNew: 'content_transcoding_new',
  aiTags: 'content_ai_tags',
  clipIngestion: 'content_clip_ingestion',
  commentsV2: 'content_comments_v2',
  windowingEnabled: 'content_windowing_enabled',
  premiumGate: 'content_premium_gate',
  recommendedRail: 'content_recommended_rail',
} as const;

export const gatewayFlags = {
  maintenanceMode: 'gateway_maintenance_mode',
  newRoutes: 'gateway_new_routes',
  circuitBreaker: 'gateway_circuit_breaker',
  responseCache: 'gateway_response_cache',
  strictRateLimits: 'gateway_strict_rate_limits',
  csrfEnforce: 'gateway_csrf_enforce',
  legacyRedirect: 'gateway_legacy_redirect',
  apiV2: 'gateway_api_v2',
} as const;

export const authFlags = {
  socialGoogle: 'auth_social_google',
  socialApple: 'auth_social_apple',
  mfaTotp: 'auth_mfa_totp',
  mfaRequiredForAdmins: 'auth_mfa_required_for_admins',
  otpEmail: 'auth_otp_email',
  otpSms: 'auth_otp_sms',
  passwordlessMagicLink: 'auth_passwordless_magic_link',
  deviceLimits: 'auth_device_limits',
  deviceLink: 'auth_device_link',
  refreshRotation: 'auth_refresh_rotation',
  emailVerificationRequired: 'auth_email_verification_required',
  roleSelect: 'auth_role_select',
} as const;

export const userFlags = {
  profileV2: 'user_profile_v2',
  universeAffinity: 'user_universe_affinity',
  continueWatching: 'user_continue_watching',
  deletionSoft: 'user_deletion_soft',
  followSystem: 'user_follow_system',
  privacySettingsV2: 'user_privacy_settings_v2',
} as const;

export const searchFlags = {
  faceted: 'search_faceted',
  typoTolerance: 'search_typo_tolerance',
  suggestionsAi: 'search_suggestions_ai',
  trendingCached: 'search_trending_cached',
  logQueries: 'search_log_queries',
  /** Numeric: trigram weight in the fuzzy blend (0–1; 0.4 = 60/40 fuzzy/trigram). */
  fuzzyTrigramWeight: 'search_fuzzy_trigram_weight',
  /** Learn popular 'did you mean' corrections from accepted suggestions. */
  typoDictionary: 'search_typo_dictionary',
  /** Scheduled job that denormalizes categories + creator displayName from the
   * content DB into the search index's content_items. */
  indexPopulation: 'search_index_population',
  /** Self-healing: recreate the pg_trgm migration's GIN trigram indexes when
   * they go missing (the SearchPgTrgmIndexesMissing alert condition). */
  indexRepair: 'search_index_repair',
} as const;

export const mediaFlags = {
  uploadChunked: 'media_upload_chunked',
  presignedUrls: 'media_presigned_urls',
  transcodeAv1: 'media_transcode_av1',
  virusScan: 'media_virus_scan',
  cdnEdgeCache: 'media_cdn_edge_cache',
} as const;

export const queueFlags = {
  processNotifications: 'queue_process_notifications',
  processPayments: 'queue_process_payments',
  processEmails: 'queue_process_emails',
  processAnalytics: 'queue_process_analytics',
  processContent: 'queue_process_content',
  concurrencyPayments: 'queue_concurrency_payments',
  dlqRetry: 'queue_dlq_retry',
  dlqRetryMaxPasses: 'queue_dlq_retry_max_passes',
  dlqRetryBaseDelayMs: 'queue_dlq_retry_base_delay_ms',
  // Per-queue DLQ overrides: when stored, these win for their queue (so ops
  // can tune payment / notification dead-letter budgets independently); unset
  // per-queue flags fall back to the shared queue_dlq_retry_* flags above.
  dlqRetryPayments: 'queue_dlq_retry_payments',
  dlqRetryMaxPassesPayments: 'queue_dlq_retry_max_passes_payments',
  dlqRetryBaseDelayMsPayments: 'queue_dlq_retry_base_delay_ms_payments',
  dlqRetryNotifications: 'queue_dlq_retry_notifications',
  dlqRetryMaxPassesNotifications: 'queue_dlq_retry_max_passes_notifications',
  dlqRetryBaseDelayMsNotifications: 'queue_dlq_retry_base_delay_ms_notifications',
  dlqRetryEmails: 'queue_dlq_retry_emails',
  dlqRetryMaxPassesEmails: 'queue_dlq_retry_max_passes_emails',
  dlqRetryBaseDelayMsEmails: 'queue_dlq_retry_base_delay_ms_emails',
} as const;

export const notificationFlags = {
  pushIos: 'notification_push_ios',
  pushAndroid: 'notification_push_android',
  emailEnabled: 'notification_email_enabled',
  smsEnabled: 'notification_sms_enabled',
  digest: 'notification_digest',
  preferencesV2: 'notification_preferences_v2',
} as const;

export const recommendationFlags = {
  collaborative: 'recommendation_collaborative',
  contentBased: 'recommendation_content_based',
  hybrid: 'recommendation_hybrid',
  crossUniverse: 'recommendation_cross_universe',
  churnModel: 'recommendation_churn_model',
  fraudModel: 'recommendation_fraud_model',
  creatorScore: 'recommendation_creator_score',
  personalizedFeed: 'recommendation_personalized_feed',
  caching: 'recommendation_caching',
} as const;

export const analyticsFlags = {
  samplingRate: 'analytics_sampling_rate',
  batchIngest: 'analytics_batch_ingest',
  reportBuilderV2: 'analytics_report_builder_v2',
  clientSampling: 'analytics_client_sampling',
} as const;

export const realityFlags = {
  votingEnabled: 'reality_voting_enabled',
  predictionsEnabled: 'reality_predictions_enabled',
  liveVoting: 'reality_live_voting',
  autoElimination: 'reality_auto_elimination',
} as const;

export const movieFlags = {
  rentalsEnabled: 'movie_rentals_enabled',
  premieresEnabled: 'movie_premieres_enabled',
  cinemaPass: 'movie_cinema_pass',
  watchlistSync: 'movie_watchlist_sync',
} as const;

export const comedyFlags = {
  challengesEnabled: 'comedy_challenges_enabled',
  specialsGate: 'comedy_specials_gate',
} as const;

export const gamesFlags = {
  tournamentsEnabled: 'games_tournaments_enabled',
  triviaAi: 'games_trivia_ai',
  leaderboardsSeasonal: 'games_leaderboards_seasonal',
} as const;

export const lifestyleFlags = {
  eventsTicketing: 'lifestyle_events_ticketing',
  storiesEnabled: 'lifestyle_stories_enabled',
  cityGuide: 'lifestyle_city_guide',
  influencerVerification: 'lifestyle_influencer_verification',
  nightlifeBooking: 'lifestyle_nightlife_booking',
  pollsEnabled: 'lifestyle_polls_enabled',
  quizzesEnabled: 'lifestyle_quizzes_enabled',
  celebrityFeed: 'lifestyle_celebrity_feed',
  musicEnabled: 'lifestyle_music_enabled',
  socialEnabled: 'lifestyle_social_enabled',
} as const;

export const verticalFlags = {
  crossoversEnabled: 'vertical_crossovers_enabled',
  timelineEnabled: 'vertical_timeline_enabled',
  loreAi: 'vertical_lore_ai',
  storyworldsCreate: 'vertical_storyworlds_create',
} as const;

export const sportsFlags = {
  predictionMarkets: 'sports_prediction_markets',
  fanContests: 'sports_fan_contests',
  liveScores: 'sports_live_scores',
  oddsFeeds: 'sports_odds_feeds',
} as const;

export const liveEventFlags = {
  ppv: 'live_event_ppv',
  streaming: 'live_event_streaming',
  tickets: 'live_event_tickets',
  chat: 'live_event_chat',
} as const;

export const engagementFlags = {
  leaderboards: 'engagement_leaderboards',
  rankings: 'engagement_rankings',
  predictions: 'engagement_predictions',
  eventIngest: 'engagement_event_ingest',
} as const;

export const messagingFlags = {
  dmEnabled: 'messaging_dm_enabled',
  readReceipts: 'messaging_read_receipts',
  typingIndicator: 'messaging_typing_indicator',
  mediaSharing: 'messaging_media_sharing',
} as const;

export const referralFlags = {
  programEnabled: 'referral_program_enabled',
  rewardBoost: 'referral_reward_boost',
  autoComplete: 'referral_auto_complete',
} as const;

export const rewardFlags = {
  pointsEnabled: 'reward_points_enabled',
  streaks: 'reward_streaks',
  badges: 'reward_badges',
  missions: 'reward_missions',
  doublePoints: 'reward_double_points',
} as const;

export const supportFlags = {
  aiChatbot: 'support_ai_chatbot',
  selfServiceRefunds: 'support_self_service_refunds',
  escalationAi: 'support_escalation_ai',
  takedownsAuto: 'support_takedowns_auto',
} as const;

export const moderationFlags = {
  aiScans: 'moderation_ai_scans',
  autoApprove: 'moderation_auto_approve',
  autoSuspend: 'moderation_auto_suspend',
  trustScores: 'moderation_trust_scores',
} as const;

export const securityFlags = {
  /** Progressive tightening: halves the effective @RateLimit limit on every
   * endpoint when on (wired via RateLimiterModule's strictModeResolver). */
  rateLimitStrict: 'security_rate_limit_strict',
} as const;

export const webFlags = {
  maintenanceMode: 'web_maintenance_mode',
  newHome: 'web_new_home',
  darkMode: 'web_dark_mode',
  autoplay: 'web_autoplay',
  lowDataDefault: 'web_low_data_default',
  recommendationsRail: 'web_recommendations_rail',
  announcementBanner: 'web_announcement_banner',
  premiumUpsell: 'web_premium_upsell',
} as const;

export const mobileFlags = {
  newHome: 'mobile_new_home',
  darkMode: 'mobile_dark_mode',
  autoplay: 'mobile_autoplay',
  lowDataDefault: 'mobile_low_data_default',
  pushEnabled: 'mobile_push_enabled',
  biometricAuth: 'mobile_biometric_auth',
} as const;

export const tvFlags = {
  /** Auto-start playback when the watch screen loads (ops can turn it off
   * without a store release, mirroring mobile_autoplay / web_autoplay). */
  autoplay: 'tv_autoplay',
} as const;

export const adminFlags = {
  newDashboard: 'admin_new_dashboard',
  featureFlagEditorV2: 'admin_feature_flag_editor_v2',
  reportBuilder: 'admin_report_builder',
  bulkActions: 'admin_bulk_actions',
  governanceDashboard: 'admin_governance_dashboard',
} as const;

// The universe sentinel builder is re-exported from @azeebo/shared-types — the
// single source of truth for universe slug VALUES (e.g. `movie`, `creator`), so
// the gateway serves exactly the keys the admin publishes and clients consume.
// (`universeFlagKey` lives in core.ts, also delegated to shared-types.)
export { universeEnabledKey } from '@azeebo/shared-types';

/** Aggregated registry for admin reference / docs generation. */
export const allFlagRegistries = {
  wallet: walletFlags,
  payment: paymentFlags,
  creator: creatorFlags,
  subscription: subscriptionFlags,
  content: contentFlags,
  gateway: gatewayFlags,
  auth: authFlags,
  user: userFlags,
  search: searchFlags,
  media: mediaFlags,
  queue: queueFlags,
  notification: notificationFlags,
  recommendation: recommendationFlags,
  analytics: analyticsFlags,
  reality: realityFlags,
  movie: movieFlags,
  comedy: comedyFlags,
  games: gamesFlags,
  lifestyle: lifestyleFlags,
  vertical: verticalFlags,
  sports: sportsFlags,
  liveEvent: liveEventFlags,
  engagement: engagementFlags,
  messaging: messagingFlags,
  referral: referralFlags,
  reward: rewardFlags,
  support: supportFlags,
  moderation: moderationFlags,
  security: securityFlags,
  web: webFlags,
  mobile: mobileFlags,
  admin: adminFlags,
} as const;

export type FlagRegistryName = keyof typeof allFlagRegistries;

/** Union of every known flag key — usable in DTOs and admin tooling. */
export type KnownFlagKey =
  (typeof allFlagRegistries)[FlagRegistryName][keyof (typeof allFlagRegistries)[FlagRegistryName]];
