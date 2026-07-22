# Azeebo+ Service Catalog

> Complete catalog of all microservices, their responsibilities, and endpoints.
> Last Updated: 2026-07-22

---

## Service Map

```
services/
├── core/                    # Platform essentials (7 services)
├── universes/               # Universe business logic (8 services)
├── engagement/              # User interaction (6 services)
├── operations/              # Platform operations (3 services)
├── intelligence/            # Data & analytics (2 services)
└── gateway/                 # API routing (1 service)
```

**Total: 27 microservices + 3 frontends**

---

## Core Services

### auth-service (`:3000`)
- **Database:** `azeebo_auth`
- **Responsibility:** Authentication, JWT tokens, OAuth, MFA, email verification, OTP, device management
- **Endpoints:**
  - Auth: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/select-role`
  - MFA: `GET /mfa/setup`, `POST /mfa/verify`, `POST /mfa/enable`, `POST /mfa/disable`
  - Social: `GET /auth/social/google/authorize`, `GET /auth/social/apple/authorize`, `POST /auth/social/callback`, `POST /auth/social/unlink`
  - Devices: `GET /auth/devices`, `DELETE /auth/devices/:deviceId`, `PATCH /auth/devices/:deviceId`, `POST /auth/devices/revoke-all`
  - OTP: `POST /otp/send`, `POST /otp/verify`
  - Admin: `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/:id`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/activate`
  - Health: `GET /health`, `GET /health/live`, `GET /health/ready`

### user-service (`:3001`)
- **Database:** `azeebo_user`
- **Responsibility:** User profiles, preferences, follows, saved items, watch history, privacy/GDPR
- **Endpoints:**
  - Users: `GET /users/me`, `PATCH /users/me`, `GET /users/:id`, `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`, `GET /users/me/preferences`, `PUT /users/me/preferences`, `GET /users/me/history`, `GET /users/me/saved`, `POST /users/me/saved`, `DELETE /users/me/saved/:contentId`, `POST /users/me/complete-profile`
  - Interactions: `GET /interactions/watchlist`, `DELETE /interactions/watchlist/:contentId`, `GET /interactions/history`, `DELETE /interactions/history/:contentId`, `GET /interactions/favorites`, `POST /interactions/favorites`, `DELETE /interactions/favorites/:contentId`
  - Privacy: `POST /privacy/deletion-request`, `DELETE /privacy/data/:userId`, `GET /privacy/data/:userId/export`, `GET /privacy/deletion-status/:userId`
  - Admin: `GET /admin/stats`, `GET /admin/users/:id`, `PATCH /admin/users/:id`, `POST /admin/users/:id/suspend`, `GET /admin/subscriptions`, `PUT /admin/subscriptions/:id`, `DELETE /admin/subscriptions/:id`, `GET /admin/analytics`, `GET /admin/audit-logs`

### wallet-service (`:3002`)
- **Database:** `azeebo_wallet`
- **Responsibility:** Virtual wallet, balances, ledger, transactions, atomic debit/credit
- **Endpoints:**
  - Wallet: `GET /wallet` (balance), `GET /wallet/transactions`, `GET /wallet/summary`, `POST /wallet/fund`, `POST /wallet/redeem-reward`, `POST /wallet/bonus-credit`, `POST /wallet/promo-credit`, `GET /wallet/audit-trail`, `POST /wallet/debit` (service-to-service), `POST /wallet/credit` (service-to-service), `POST /wallet/withdraw`, `POST /wallet/transfer`, `GET /wallet/transactions/:id`
  - Admin: `GET /admin/stats`, `GET /admin/wallets`, `GET /admin/wallets/:walletId`, `GET /admin/wallets/user/:userId`, `GET /admin/wallets/:walletId/transactions`
- **Critical:** Uses atomic transactions with `SELECT ... FOR UPDATE`

### payment-service (`:3003`)
- **Database:** `azeebo_payment`
- **Responsibility:** Payment processing, gateway integration (Paystack/Flutterwave), deposits, refunds
- **Endpoints:**
  - Payments: `POST /payments/initialize`, `POST /payments/verify`, `GET /payments/history`, `GET /payments/:id`, `POST /payments/refund-request`
  - Webhooks: `POST /webhooks/paystack`, `POST /webhooks/flutterwave`
  - Pricing: `GET /pricing/movie`, `GET /pricing/vote-packages/:type`, `GET /pricing/subscriptions`, `GET /pricing/wallet`, `GET /pricing/passes`
  - Admin: `GET /admin/stats`, `GET /admin/payments`, `GET /admin/payments/:paymentId`, `GET /admin/payment-intents`, `GET /admin/refunds`, `GET /admin/webhook-events`

### content-service (`:3004`)
- **Database:** `azeebo_content`
- **Responsibility:** Content CRUD, moderation, media, transcoding, categories, tags, relationships, access control
- **Endpoints:** 81 endpoints total (see content-service/README.md for full list)
  - Content: Full CRUD + feeds, trending, search, categories, tags, relationships, media, transcoding, comments, reports
  - Moderation: Scan, cases, actions, appeals, trust scores
  - Public: Universes, settings, feature flags
  - Admin: Stats, content management, universe management

### search-service (`:3005`)
- **Database:** `azeebo_search`
- **Responsibility:** Full-text search, faceted filtering, suggestions, trending
- **Endpoints:**
  - Search: `GET /search`, `GET /search/faceted`, `GET /search/suggestions`, `GET /search/trending`, `GET /search/facets`, `POST /search/log`
  - Admin: `GET /admin/stats`, `GET /admin/queries`

### media-service (`:3019`)
- **Database:** `azeebo_media`
- **Responsibility:** File upload, transcoding, CDN, premium content URLs
- **Endpoints:**
  - Upload: `POST /media/upload/image`, `POST /media/upload/video`, `POST /media/upload/audio`, `POST /media/upload/document`, `POST /media/upload/thumbnail`, `POST /media/upload/avatar`, `POST /media/upload/banner`
  - URLs: `GET /media/presigned/upload`, `GET /media/presigned/download`, `GET /media/metadata`
  - Transcoding: `GET /media/transcoding/:jobId/status`, `GET /media/transcoding/jobs`, `POST /media/transcoding/retry-failed`
  - Premium: `POST /media/premium/url`, `GET /media/premium/url/:token/analytics`, `DELETE /media/premium/url/:token`
  - Admin: `GET /admin/stats`, `GET /admin/uploads`, `DELETE /admin/uploads/:id`

---

## Universe Services

### reality-service (`:3010`)
- **Database:** `azeebo_reality`
- **Responsibility:** Shows, episodes, contestants, voting, supervotes, predictions, leaderboards
- **Endpoints:**
  - Shows: `GET /reality/shows`, `GET /reality/shows/:showId`, `POST /reality/shows`, `PUT /reality/shows/:showId`, `DELETE /reality/shows/:showId`
  - Episodes: `GET /reality/shows/:showId/episodes`, `POST /reality/shows/:showId/episodes`, `PUT /reality/episodes/:episodeId`, `DELETE /reality/episodes/:episodeId`, `GET /reality/episodes/:episodeId`
  - Contestants: `GET /reality/shows/:showId/contestants`, `POST /reality/shows/:showId/contestants`, `PUT /reality/contestants/:contestantId`, `DELETE /reality/contestants/:contestantId`, `GET /reality/contestants/:contestantId`
  - Voting: `POST /reality/votes`, `POST /reality/votes/quantity`, `POST /reality/supervotes`
  - Predictions: `POST /reality/predictions`, `GET /reality/predictions/:showId`, `GET /reality/shows/:showId/predictions`
  - Other: `GET /reality/shows/:showId/leaderboard`, `GET /reality/clips`, `GET /reality/wallet/balance`, `GET /reality/pricing`, `GET /reality/premium-extras`, `POST /reality/premium-extras/:extraId/purchase`
  - Admin: `GET /admin/reality-shows`, `GET /admin/reality-shows/:showId`, `PUT /admin/reality-shows/:showId/status`

### creator-service (`:3018`)
- **Database:** `azeebo_creator`
- **Responsibility:** Creator profiles, verification, uploads, analytics, monetization, earnings
- **Endpoints:**
  - Creator: `POST /creators/onboard`, `POST /creators/verification/submit`, `GET /creators/verification/status`, `GET /creators/me`, `PATCH /creators/me`, `GET /creators/channels`, `POST /creators/channels`, `GET /creators/analytics`, `GET /creators/earnings`, `POST /creators/payouts`, `PUT /creators/settings`
  - Content: `GET /creators/uploads`, `POST /creators/uploads`, `POST /creators/channels/:channelId/uploads`
  - Social: `GET /creators/discover`, `POST /creators/tips/:creatorId`, `POST /creators/subscribe/:creatorId`, `DELETE /creators/subscribe/:creatorId`
  - Admin: `GET /admin/stats`, `GET /admin/creators`, `GET /admin/creators/:creatorId`, `POST /admin/creators/:creatorId/verify`, `POST /admin/creators/:creatorId/unverify`, `GET /admin/payouts`

### lifestyle-service (`:3016`)
- **Database:** `azeebo_lifestyle`
- **Responsibility:** Events, venues, nightlife, influencer content, city guides, challenges, polls, quizzes
- **Endpoints:**
  - Feed: `GET /lifestyle/feed`, `GET /lifestyle/feed/trending`
  - Stories: `GET /lifestyle/stories`, `POST /lifestyle/stories`, `PATCH /lifestyle/stories/:id`, `DELETE /lifestyle/stories/:id`
  - Events: `GET /lifestyle/events`, `POST /lifestyle/events`, `PATCH /lifestyle/events/:id`, `DELETE /lifestyle/events/:id`, `POST /lifestyle/events/:id/rsvp`, `DELETE /lifestyle/events/:id/rsvp`
  - City Guide: `GET /lifestyle/city-guide`, `POST /lifestyle/city-guide`, `PATCH /lifestyle/city-guide/:id`, `DELETE /lifestyle/city-guide/:id`
  - Music: `GET /lifestyle/music`, `POST /lifestyle/music`, `PATCH /lifestyle/music/:id`, `DELETE /lifestyle/music/:id`
  - Celebrity: `GET /lifestyle/celebrities`, `POST /lifestyle/celebrities`, `PATCH /lifestyle/celebrities/:id`, `DELETE /lifestyle/celebrities/:id`
  - Nightlife: `GET /lifestyle/nightlife`, `POST /lifestyle/nightlife`, `PATCH /lifestyle/nightlife/:id`, `DELETE /lifestyle/nightlife/:id`
  - Influencer: `GET /lifestyle/influencers`, `POST /lifestyle/influencers`, `PATCH /lifestyle/influencers/:id`, `DELETE /lifestyle/influencers/:id`
  - Challenges: `GET /challenges`, `POST /challenges`, `POST /challenges/:id/submit`, `POST /challenges/submissions/:id/vote`
  - Polls: `GET /polls`, `POST /polls`, `POST /polls/:id/vote`
  - Quizzes: `GET /quizzes`, `POST /quizzes`, `POST /quizzes/:id/start`, `POST /quizzes/attempts/:attemptId/submit`

### vertical-service (`:3017`)
- **Database:** `azeebo_vertical`
- **Responsibility:** Storyworlds, titles, characters, lore, crossovers, timelines
- **Endpoints:**
  - Universes: `GET /vertical/universes`, `GET /vertical/universes/map/:slug`, `GET /vertical/universes/locations`
  - Characters: `GET /vertical/characters`, `GET /vertical/characters/:slug`, `GET /vertical/characters/:slug/relationships`
  - Timeline: `GET /vertical/timeline`, `GET /vertical/timeline/event/:id`, `GET /vertical/timeline/upcoming`
  - Titles: `GET /vertical/titles`, `GET /vertical/titles/featured`, `GET /vertical/titles/:slug`
  - Lore: `GET /vertical/lore`, `GET /vertical/lore/categories`, `GET /vertical/lore/:slug`
  - Crossovers: `GET /vertical/crossovers`, `GET /vertical/crossovers/recaps`
  - Storyworlds: `GET /vertical/storyworlds`, `GET /vertical/storyworlds/:slug`, `GET /vertical/storyworlds/:slug/titles`, `GET /vertical/storyworlds/:slug/characters`, `GET /vertical/storyworlds/:slug/theories`, `POST /vertical/storyworlds/:slug/theories`

### movie-service (`:3011`)
- **Database:** `azeebo_movie`
- **Responsibility:** Films, screenings, premieres, watchlist, passes, rentals
- **Endpoints:**
  - Movies: `GET /movies`, `GET /movies/premieres`, `GET /movies/watchlist`, `POST /movies/watchlist`, `DELETE /movies/watchlist/:movieId`, `GET /movies/:movieId`, `POST /movies/:movieId/rent`, `GET /movies/me/library`
  - Filmmakers: `GET /movies/filmmakers/projects`, `POST /movies/filmmakers/projects`, `POST /movies/filmmakers/back`
  - Passes: `GET /movies/passes`, `POST /movies/passes/subscribe`, `DELETE /movies/passes/cancel`, `GET /movies/passes/access/:movieId`
  - Admin: `GET /admin/stats`, `GET /admin/movies`, `GET /admin/premieres`

### games-service (`:3014`)
- **Database:** `azeebo_games`
- **Responsibility:** Games, daily challenges, trivia, tournaments, scoring
- **Endpoints:**
  - Games: `GET /games`, `GET /games/home`, `GET /games/categories`, `GET /games/:slug`, `POST /games/:gameId/start`, `POST /games/answer`, `POST /games/:sessionId/complete`
  - Challenges: `GET /games/daily-challenge`, `POST /games/daily-challenge/submit`
  - Sessions: `POST /games/sessions`, `POST /games/sessions/:sessionId/submit`
  - Tournaments: `GET /games/tournaments`, `GET /games/tournaments/:id`, `POST /games/tournaments/:id/enter`, `POST /games/tournaments/:id/score`, `GET /games/tournaments/:id/leaderboard`
  - Other: `GET /games/leaderboard`, `GET /games/stats/:userId`

### comedy-service (`:3016`)
- **Database:** `azeebo_comedy`
- **Responsibility:** Skits, comedians, specials, comedy challenges
- **Endpoints:**
  - Feed: `GET /comedy`, `GET /comedy/trending`
  - Clips: `GET /comedy/clips`, `GET /comedy/clips/:id`, `POST /comedy/clips/:id/like`, `POST /comedy/clips/:id/comment`, `POST /comedy/clips/:clipId/share`
  - Comedians: `GET /comedy/comedians`
  - Series: `GET /comedy/series`
  - Specials: `GET /comedy/specials`, `GET /comedy/specials/:id`, `POST /comedy/specials/:id/like`
  - Challenges: `GET /comedy/challenges`, `POST /comedy/challenges`
  - Trends: `POST /comedy/trends/record`

### sports-service (`:3021`)
- **Database:** `azeebo_sports`
- **Responsibility:** Sports content, predictions, fan boards, contests
- **Endpoints:**
  - Sports: `GET /sports/home`, `GET /sports/highlights`, `GET /sports/fixtures`, `GET /sports/fixtures/:id`, `GET /sports/leaderboard`
  - Predictions: `GET /sports/predictions`, `POST /sports/predictions`, `GET /sports/predictions/leaderboard`, `GET /sports/predictions/my`, `POST /sports/predictions/:id/predict`, `POST /sports/predictions/:id/settle`
  - Fan Contests: `GET /sports/fan-contests`, `GET /sports/fan-contests/:id`, `POST /sports/fan-contests/:id/enter`, `POST /sports/fan-contests/:id/score`, `GET /sports/fan-contests/:id/leaderboard`
  - Fixtures: `GET /sports/fixtures`, `GET /sports/fixtures/sports`, `POST /sports/fixtures/:id/result`

---

## Engagement Services

### notification-service (`:3006`)
- **Database:** `azeebo_notification`
- **Responsibility:** Push, email, SMS notifications, campaigns, templates
- **Endpoints:**
  - Notifications: `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`, `PUT /notifications/preferences`, `GET /notifications/settings`, `GET /notifications/unread-count`
  - Push Tokens: `POST /notifications/push-tokens`, `GET /notifications/push-tokens`, `DELETE /notifications/push-tokens/:tokenId`
  - Admin: `GET /admin/stats`, `GET /admin/notifications`, `POST /admin/notifications`, `GET /admin/templates`, `POST /admin/templates`, `PUT /admin/templates/:id`, `DELETE /admin/templates/:id`, `GET /admin/campaigns`, `POST /admin/campaigns`, `POST /admin/campaigns/:id/send`

### reward-service (`:3007`)
- **Database:** `azeebo_reward`
- **Responsibility:** Points, badges, missions, streaks, reward redemption
- **Endpoints:**
  - Rewards: `GET /rewards` (overview), `GET /rewards/missions`, `GET /rewards/badges`, `GET /rewards/streak`, `POST /rewards/redeem`, `GET /rewards/level`, `POST /rewards/earn`, `GET /rewards/balance`, `GET /rewards/history`
  - Admin: `GET /admin/stats`, `GET /admin/rewards`, `GET /admin/rewards/:id/transactions`, `GET /admin/missions`, `POST /admin/missions`, `PUT /admin/missions/:id`, `GET /admin/badges`, `POST /admin/badges`, `POST /admin/badges/:id/assign`, `GET /admin/levels`, `POST /admin/levels`, `PUT /admin/levels/:id`

### referral-service (`:3025`)
- **Database:** `azeebo_referral`
- **Responsibility:** Referral codes, tracking, rewards
- **Endpoints:**
  - Referrals: `GET /referrals/code`, `POST /referrals/generate`, `POST /referrals/apply`, `GET /referrals`, `GET /referrals/stats`, `POST /referrals/complete/:referralId`
  - Admin: `GET /admin/stats`, `GET /admin/referrals`, `GET /admin/config`, `PUT /admin/config`

### messaging-service (`:3024`)
- **Database:** `azeebo_messaging`
- **Responsibility:** Direct messaging, conversations
- **Endpoints:**
  - Messaging: `GET /messaging/conversations`, `GET /messaging/conversations/:id/messages`, `POST /messaging/conversations`, `POST /messaging/conversations/:id/messages`, `POST /messaging/conversations/:id/read`, `DELETE /messaging/conversations/:id`
  - Admin: `GET /admin/stats`, `GET /admin/conversations`, `GET /admin/conversations/:id/messages`

### engagement-service (`:3023`)
- **Database:** `azeebo_engagement`
- **Responsibility:** Leaderboards, rankings, predictions
- **Endpoints:**
  - Engagement: `GET /engagement/leaderboard`, `GET /engagement/rankings`, `GET /engagement/predictions/:contentId/results`, `POST /engagement/predictions`
  - Admin: `GET /admin/stats`, `GET /admin/leaderboard`, `GET /admin/predictions`, `POST /admin/predictions/:id/resolve`

### subscription-service (`:3026`)
- **Database:** `azeebo_subscription`
- **Responsibility:** Subscription plans, billing, renewals
- **Endpoints:**
  - Subscription: `GET /subscription/plans`, `GET /subscription/plans/:id`, `POST /subscription/plans`, `PUT /subscription/plans/:id`, `DELETE /subscription/plans/:id`, `POST /subscription/subscribe`, `GET /subscription/current`, `DELETE /subscription/:id`, `GET /subscription/history`, `POST /subscription/renew`

---

## Operations Services

### moderation-service (`:3022`)
- **Database:** `azeebo_moderation`
- **Responsibility:** Content moderation, reports, safety scanning
- **Endpoints:**
  - `POST /moderation/report`, `GET /moderation/report-types`, `POST /moderation/appeal`, `GET /moderation/queue`, `GET /moderation/trust-score/:userId`, `POST /moderation/safety-action`, `GET /moderation/safety-actions`, `POST /moderation/scan`, `GET /moderation/scan/:scanId`, `GET /moderation/content/:contentId/safety`

### queue-service (`:3015`)
- **Database:** `azeebo_queue`
- **Responsibility:** Background job processing (notifications, payments, emails, analytics)
- **Endpoints:**
  - `GET /queue/stats`, `GET /queue/:queue/jobs`, `GET /queue/:queue/jobs/failed`, `GET /queue/:queue/jobs/:jobId`, `POST /queue/:queue/jobs/:jobId/retry`, `POST /queue/:queue/retry-all-failed`, `DELETE /queue/:queue/jobs/:jobId`, `POST /queue/:queue/pause`, `POST /queue/:queue/resume`, `POST /queue/:queue/clean`

### support-service (`:3020`)
- **Database:** `azeebo_support`
- **Responsibility:** Support tickets, refunds, chargebacks, appeals, disputes, suspensions, takedowns
- **Endpoints:** 40+ endpoints (see support-service for full list)

---

## Intelligence Services

### analytics-service (`:3008`)
- **Database:** `azeebo_analytics`
- **Responsibility:** Event ingestion, metrics, dashboards, intelligence, report building
- **Endpoints:**
  - Analytics: `POST /analytics/events`, `POST /analytics/track`, `POST /analytics/track-batch`, `GET /analytics/dashboard`, `GET /analytics/funnels`, `GET /analytics/cohorts`, `GET /analytics/retention`, `GET /analytics/revenue`, `GET /analytics/engagement`, `GET /analytics/realtime`, `GET /analytics/kpis`
  - Instrumentation: `POST /instrumentation/track`, `POST /instrumentation/track-batch`, `POST /instrumentation/screen-view`, `POST /instrumentation/content-impression`, `POST /instrumentation/payment`, `POST /instrumentation/reward`, `POST /instrumentation/game`, `POST /instrumentation/prediction`, `POST /instrumentation/share`
  - Intelligence: `GET /intelligence/personalization`, `GET /intelligence/segments`, `POST /intelligence/segments`, `GET /intelligence/creator-scores`, `GET /intelligence/churn-risks`, `GET /intelligence/fraud-detections`
  - Reports: `POST /reports`, `GET /reports`, `GET /reports/:id`, `PUT /reports/:id`, `DELETE /reports/:id`, `POST /reports/execute`, `GET /reports/:id/executions`

### recommendation-service (`:3009`)
- **Database:** `azeebo_recommendation`
- **Responsibility:** Content recommendations, personalization, creator scores
- **Endpoints:**
  - `GET /recommendation/content`, `GET /recommendation/creators`, `GET /recommendation/cross-universe`, `GET /recommendation/trending`, `GET /recommendation/user-segment`, `GET /recommendation/creator-score`, `GET /recommendation/churn-risk`, `GET /recommendation/monetization-insights`, `GET /recommendation/fraud-risk`, `GET /recommendation/personalized-feed`

---

## Gateway

### api-gateway (`:3013`)
- **Database:** None (stateless)
- **Responsibility:** Request routing, JWT validation, rate limiting, CORS, health aggregation
- **Routes to:** All 26 backend services
- **Health:** `GET /health`, `GET /ready`, `GET /live`
