# Azeebo+ Service Catalog

> Complete catalog of all microservices, their responsibilities, and endpoints.
> Last Updated: 2026-09-28

---

## Service Map

```
services/
├── core/                    # Platform essentials (8 services)
├── universes/               # Universe business logic (9 services)
├── engagement/              # User interaction (6 services)
├── operations/              # Platform operations (3 services)
├── intelligence/            # Data & analytics (2 services)
└── gateway/                 # API routing (1 service)
```

**Total: 29 microservices + 5 frontends**

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
  - Users: `GET /users/me`, `PATCH /users/me`, `GET /users/:id`, `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`, `GET /users/me/preferences`, `PUT /users/me/preferences`, `GET /users/me/history`, `POST /users/me/history`, `GET /users/me/saved`, `POST /users/me/saved`, `DELETE /users/me/saved/:contentId`, `POST /users/me/complete-profile`, `GET /users/me/universe-affinity`, `PATCH /users/me/universe-affinity`, `GET /users/me/continue-watching`, `GET /users/me/universes`
  - Avatar: `POST /users/me/avatar`, `DELETE /users/me/avatar`, `GET /users/me/avatar/upload-url`
  - Privacy Settings: `GET /users/me/privacy-settings`, `PUT /users/me/privacy-settings`
  - Interactions: `GET /interactions/watchlist`, `DELETE /interactions/watchlist/:contentId`, `GET /interactions/history`, `DELETE /interactions/history/:contentId`, `GET /interactions/favorites`, `POST /interactions/favorites`, `DELETE /interactions/favorites/:contentId`
  - GDPR: `POST /privacy/deletion-request`, `DELETE /privacy/data/:userId`, `GET /privacy/data/:userId/export`, `GET /privacy/deletion-status/:userId`
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

### knowledge-service (`:3020`)
- **Database:** `azeebo_knowledge`
- **Responsibility:** Canonical narrative events, knowledge graph units, spoiler filtering, user knowledge grants, equivalence sets, checkpoint triggers, and reading projections
- **Endpoints:**
  - Canonical Events: `POST /knowledge/events`, `GET /knowledge/events/:id`, `PATCH /knowledge/events/:id/supersede`
  - Knowledge Units: `POST /knowledge/units`, `GET /knowledge/units/:id`, `POST /knowledge/units/:id/correct`
  - Knowledge Grants: `POST /knowledge/grants`, `GET /knowledge/users/:userId/grants`, `GET /knowledge/users/:userId/known-ids`
  - Projections: `GET /knowledge/users/:userId/projection`, `POST /knowledge/users/:userId/projection/rebuild`
  - Equivalence Sets: `POST /knowledge/equivalence-sets`, `GET /knowledge/equivalence-sets/:setCode`
  - Checkpoints: `POST /knowledge/checkpoints`, `POST /knowledge/checkpoints/:id/trigger`
  - Spoiler Control: `POST /knowledge/spoiler-filter`
  - Aggregates (AOU Hub): `GET /knowledge/summary`, `GET /knowledge/what-you-know`, `GET /knowledge/locked`
  - Health: `GET /health`

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
  - Admin (reality-service): `GET /admin/reality-shows`, `GET /admin/reality-shows/:showId`, `PUT /admin/reality-shows/:showId/status`, `POST /admin/reality-shows/:showId/auto-eliminate`
  - Admin (apps/admin BFF): `GET /admin/reality-shows`, `GET /admin/reality-shows/:id`, `POST /admin/reality-shows`, `PATCH /admin/reality-shows/:id`, `PUT /admin/reality-shows/:id/status`, `DELETE /admin/reality-shows/:id` (served directly by `apps/admin/src/modules/reality-shows/`)

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
- **Responsibility:** Events, venues, nightlife, influencer content, city guides, challenges, polls, quizzes, music, stories, social
- **Endpoints:**
  - Feed: `GET /lifestyle/feed`, `GET /lifestyle/feed/trending`
  - Stories: `GET /lifestyle/stories`, `GET /lifestyle/stories/categories`, `GET /lifestyle/stories/:slug`, `POST /lifestyle/stories`, `PATCH /lifestyle/stories/:id`, `DELETE /lifestyle/stories/:id`, `POST /lifestyle/stories/:id/view`
  - Events: `GET /lifestyle/events`, `GET /lifestyle/events/categories`, `GET /lifestyle/events/upcoming`, `GET /lifestyle/events/:slug`, `POST /lifestyle/events`, `PATCH /lifestyle/events/:id`, `DELETE /lifestyle/events/:id`, `POST /lifestyle/events/:id/rsvp`, `DELETE /lifestyle/events/:id/rsvp`, `GET /lifestyle/events/:id/attendees`
  - City Guide: `GET /lifestyle/city-guide`, `GET /lifestyle/city-guide/featured`, `GET /lifestyle/city-guide/search`, `GET /lifestyle/city-guide/tags`, `GET /lifestyle/city-guide/:slug`, `POST /lifestyle/city-guide`, `PATCH /lifestyle/city-guide/:id`, `DELETE /lifestyle/city-guide/:id`
  - Music: `GET /lifestyle/music`, `GET /lifestyle/music/trending`, `GET /lifestyle/music/genres`, `GET /lifestyle/music/genres/:slug`, `GET /lifestyle/music/artists/:id`, `GET /lifestyle/music/:slug`, `POST /lifestyle/music`, `PATCH /lifestyle/music/:id`, `DELETE /lifestyle/music/:id`
  - Celebrity: `GET /lifestyle/celebrity`, `GET /lifestyle/celebrity/featured`, `GET /lifestyle/celebrity/:slug`, `GET /lifestyle/celebrity/:celebrityId/news`, `POST /lifestyle/celebrity`, `POST /lifestyle/celebrity/news`, `PATCH /lifestyle/celebrity/:id`, `DELETE /lifestyle/celebrity/:id`
  - Nightlife: `GET /lifestyle/nightlife`, `GET /lifestyle/nightlife/featured`, `GET /lifestyle/nightlife/:slug`, `POST /lifestyle/nightlife`, `PATCH /lifestyle/nightlife/:id`, `DELETE /lifestyle/nightlife/:id`
  - Influencer: `GET /lifestyle/influencers`, `GET /lifestyle/influencers/featured`, `GET /lifestyle/influencers/:slug`, `GET /lifestyle/influencers/:influencerId/collaborations`, `POST /lifestyle/influencers`, `POST /lifestyle/influencers/collaborations`, `PATCH /lifestyle/influencers/:id`, `DELETE /lifestyle/influencers/:id`
  - Challenges: `GET /lifestyle/challenges`, `GET /lifestyle/challenges/:id`, `POST /lifestyle/challenges`, `POST /lifestyle/challenges/:id/submit`, `POST /lifestyle/challenges/submissions/:id/vote`
  - Polls: `GET /lifestyle/polls`, `GET /lifestyle/polls/:id`, `POST /lifestyle/polls`, `POST /lifestyle/polls/:id/vote`
  - Quizzes: `GET /lifestyle/quizzes`, `GET /lifestyle/quizzes/:id`, `POST /lifestyle/quizzes`, `POST /lifestyle/quizzes/:id/start`, `POST /lifestyle/quizzes/attempts/:attemptId/submit`, `GET /lifestyle/quizzes/:id/leaderboard`
  - Guides: `GET /lifestyle/guides/itineraries`, `GET /lifestyle/guides/itineraries/:id`, `POST /lifestyle/guides/itineraries`, `PATCH /lifestyle/guides/itineraries/:id`, `DELETE /lifestyle/guides/itineraries/:id`, `GET /lifestyle/guides/neighborhoods`, `GET /lifestyle/guides/neighborhoods/:id`, `POST /lifestyle/guides/neighborhoods`, `PATCH /lifestyle/guides/neighborhoods/:id`, `DELETE /lifestyle/guides/neighborhoods/:id`, `GET /lifestyle/guides/partners`, `GET /lifestyle/guides/partners/:id`, `POST /lifestyle/guides/partners`, `PATCH /lifestyle/guides/partners/:id`, `DELETE /lifestyle/guides/partners/:id`, `GET /lifestyle/guides/partners/:partnerId/offers`, `GET /lifestyle/guides/offers/:id`, `POST /lifestyle/guides/partners/:partnerId/offers`, `PATCH /lifestyle/guides/offers/:id`, `DELETE /lifestyle/guides/offers/:id`
  - Social: `POST /lifestyle/social/save`, `DELETE /lifestyle/social/save`, `GET /lifestyle/social/saved`, `GET /lifestyle/social/saved/check`, `POST /lifestyle/social/share`, `GET /lifestyle/social/share/count`
  - Participation: `GET /lifestyle/participation/:id/result`
  - Admin: `GET /admin/stats`, `GET /admin/content`, `GET /admin/users`

### vertical-service (`:3017`)
- **Database:** `azeebo_vertical`
- **Responsibility:** Storyworlds, titles, characters, lore, crossovers, timelines
- **Endpoints:**
  - Universes: `GET /vertical/universes`, `GET /vertical/universes/map/:slug`, `GET /vertical/universes/locations`
  - Characters: `GET /vertical/characters`, `GET /vertical/characters/:slug`, `GET /vertical/characters/:slug/relationships`
  - Timeline: `GET /vertical/timeline`, `GET /vertical/timeline/event/:id`, `GET /vertical/timeline/upcoming`
  - Titles: `GET /vertical/titles`, `GET /vertical/titles/featured`, `GET /vertical/titles/:slug`, `GET /vertical/titles/:slug/episodes`, `GET /vertical/titles/:slug/characters`, `GET /vertical/titles/:slug/related`, `POST /vertical/titles`, `PATCH /vertical/titles/:id`, `DELETE /vertical/titles/:id`, `POST /vertical/titles/:titleId/chapters`, `GET /vertical/titles/:titleId/chapters/:number`
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
  - Digital Box Office: `GET /movies/dbo/overview`
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

### comedy-service (`:3012`)
- **Database:** `azeebo_comedy`
- **Responsibility:** Skits, comedians, specials, comedy challenges
- **Endpoints:**
  - Feed: `GET /comedy`, `GET /comedy/trending`, `GET /comedy/categories`, `GET /comedy/top-rated`
  - Clips: `GET /comedy/clips`, `GET /comedy/clips/:id`, `POST /comedy/clips/:id/like`, `POST /comedy/clips/:id/comment`, `POST /comedy/clips/:clipId/share`
  - Comedians: `GET /comedy/comedians`, `GET /comedy/comedians/:id`
  - Series: `GET /comedy/series`
  - Specials: `GET /comedy/specials`, `GET /comedy/specials/:id`, `POST /comedy/specials/:id/like`
  - Challenges: `GET /comedy/challenges`, `POST /comedy/challenges`
  - Trends: `POST /comedy/trends/record`
  - Admin: `GET /admin/stats`, `GET /admin/clips`, `GET /admin/comedians`

### sports-service (`:3021`)
- **Database:** `azeebo_sports`
- **Responsibility:** Sports content, predictions, fan boards, contests, live scores, highlights
- **Endpoints:**
  - Sports Hub: `GET /sports/home`, `GET /sports/live`, `GET /sports/categories`, `GET /sports/upcoming`, `GET /sports/leaderboard`, `GET /sports/fan-boards`, `GET /sports/fan-contests`, `POST /sports/fan-contests/:id/enter`, `GET /sports/prediction-options`, `GET /sports/score-options`, `GET /sports/current-match`, `GET /sports/prediction-leagues`, `GET /sports/predictions`, `POST /sports/predictions`
  - Live Scores: `GET /sports/live/scores`, `GET /sports/live/match/:matchId`
  - Highlights: `GET /sports/highlights`, `GET /sports/highlights/:id`
  - Fixtures: `GET /fixtures`, `GET /fixtures/sports`, `GET /fixtures/:id`, `POST /fixtures/:id/metadata`, `POST /fixtures/:id/result`
  - Prediction Markets: `GET /prediction-markets`, `GET /prediction-markets/leaderboard`, `GET /prediction-markets/my`, `GET /prediction-markets/:id`, `POST /prediction-markets/create`, `POST /prediction-markets/:id/predict`, `POST /prediction-markets/:id/settle`
  - Fan Contests: `GET /fan-contests`, `GET /fan-contests/:id`, `POST /fan-contests/:id/enter`, `POST /fan-contests/:id/score`, `GET /fan-contests/:id/leaderboard`, `GET /fan-contests/:id/rank/:userId`, `POST /fan-contests/:id/end`
  - Admin: `GET /admin/stats`, `GET /admin/events`, `GET /admin/predictions`

### live-event-service (`:3027`)
- **Database:** `azeebo_live_event`
- **Responsibility:** Pay-per-view live events, streaming, ticketing, access control
- **Endpoints:**
  - Events: `GET /live-events`, `GET /live-events/:eventId`, `POST /live-events`, `PUT /live-events/:eventId`, `DELETE /live-events/:eventId`
  - Streaming: `POST /live-events/:eventId/stream/start`, `POST /live-events/:eventId/stream/stop`, `GET /live-events/:eventId/stream/url`
  - Tickets: `GET /live-events/:eventId/tickets`, `POST /live-events/:eventId/tickets/purchase`, `GET /live-events/:eventId/tickets/verify`
  - Access: `GET /live-events/:eventId/access`, `POST /live-events/:eventId/access/check`
  - Admin: `GET /admin/live-events`, `GET /admin/live-events/:eventId`, `PUT /admin/live-events/:eventId/status`

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
- **Responsibility:** Direct messaging, conversations, watch parties, live chat
- **Endpoints:**
  - Messaging: `GET /messaging/conversations`, `GET /messaging/conversations/search`, `GET /messaging/conversations/:id/messages`, `GET /messaging/messages/search`, `POST /messaging/conversations`, `PUT /messaging/conversations/:id`, `POST /messaging/conversations/:id/messages`, `POST /messaging/conversations/:id/messages/reply`, `POST /messaging/conversations/:id/messages/:messageId/react`, `GET /messaging/conversations/:id/messages/:messageId/reactions`, `GET /messaging/conversations/:id/messages/:messageId/thread`, `PUT /messaging/messages/:messageId`, `DELETE /messaging/messages/:messageId`, `PUT /messaging/messages/:messageId/pin`, `POST /messaging/conversations/:id/read`, `POST /messaging/conversations/:id/participants`, `DELETE /messaging/conversations/:id/participants/:userId`, `PUT /messaging/conversations/:id/mute`, `PUT /messaging/conversations/:id/archive`, `DELETE /messaging/conversations/:id`
  - Watch Parties: `POST /messaging/watch-parties`, `POST /messaging/watch-parties/join`, `GET /messaging/watch-parties/my`, `GET /messaging/watch-parties/:partyId`, `POST /messaging/watch-parties/:partyId/playback`, `POST /messaging/watch-parties/:partyId/sync`, `POST /messaging/watch-parties/:partyId/chat`, `GET /messaging/watch-parties/:partyId/chat`, `POST /messaging/watch-parties/:partyId/leave`, `DELETE /messaging/watch-parties/:partyId`
  - Admin: `GET /admin/stats`, `GET /admin/conversations`, `GET /admin/conversations/:id/messages`, `GET /admin/messages`, `DELETE /admin/conversations/:id`, `PUT /admin/conversations/:id`, `DELETE /admin/messages/:id`

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

### support-service (`:3028`)
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
- **Routes to:** All 28 downstream backend services
- **Health:** `GET /health`, `GET /ready`, `GET /live`
