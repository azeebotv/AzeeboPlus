# @azeebo/analytics-sdk

Shared analytics SDK for Azeebo+ applications with consent management, batching, and retry logic.

## Features

- **Event Tracking**: Track user events with consent-aware filtering
- **Consent Management**: GDPR-compliant consent categories with localStorage persistence
- **Batching & Retry**: Automatic event batching with exponential backoff retry
- **User Context**: Attach user identity to all events for attribution
- **Standard Events**: Predefined event types following Azeebo naming conventions

## Installation

```bash
pnpm add @azeebo/analytics-sdk
```

## Usage

```typescript
import { AzeeboAnalytics, ConsentCategory } from '@azeebo/analytics-sdk';

// Initialize with config
const analytics = new AzeeboAnalytics({
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  endpoint: process.env.ANALYTICS_ENDPOINT,
  consentCategories: {
    essential: true,
    analytics: true,
    marketing: false,
  },
});

// Set user context
analytics.setUserId('user-123');

// Track events
analytics.track('content_viewed', {
  contentId: 'content-123',
  universe: 'reality',
});
```

## Consent Categories

| Category | Description | Default |
|----------|-------------|---------|
| `essential` | Required for core functionality | `true` |
| `analytics` | Usage analytics and metrics | `true` |
| `marketing` | Marketing and advertising | `false` |
| `personalization` | Personalized content recommendations | `false` |
| `third_party` | Third-party analytics integrations | `false` |

## Standard Events

### Authentication
| Event | Properties | Description |
|-------|-----------|-------------|
| `user_signup_viewed` | `method` | User views signup form |
| `user_signup_submitted` | `method` | User submits signup |
| `user_signup_completed` | `userId`, `method` | Signup successful |
| `user_signup_failed` | `method`, `error` | Signup failed |
| `user_login_viewed` | `method` | User views login form |
| `user_login_submitted` | `method` | User submits login |
| `user_login_completed` | `userId`, `method` | Login successful |
| `user_login_failed` | `method`, `error` | Login failed |
| `user_logged_out` | - | User logs out |

### Content
| Event | Properties | Description |
|-------|-----------|-------------|
| `content_viewed` | `contentId`, `contentType`, `title`, `universe` | Content page viewed |
| `content_search_viewed` | `query` | Search page viewed |
| `content_search_submitted` | `query`, `filters` | Search submitted |
| `content_search_completed` | `query`, `resultsCount` | Search results loaded |
| `content_search_failed` | `query`, `error` | Search failed |
| `play_start` | `contentId`, `contentType` | Playback started |
| `play_complete` | `contentId`, `contentType`, `watchDuration` | Playback completed |
| `content_paused` | `contentId`, `contentType`, `pausedAt` | Playback paused |
| `content_saved` | `contentId`, `contentType` | Content saved |
| `content_shared` | `contentId`, `contentType`, `shareMethod` | Content shared |
| `content_liked` | `contentId`, `contentType` | Content liked |
| `content_commented` | `contentId`, `contentType` | Comment posted |

### Payments
| Event | Properties | Description |
|-------|-----------|-------------|
| `payment_viewed` | `amount`, `currency`, `paymentMethod` | Payment page viewed |
| `payment_submitted` | `amount`, `currency`, `paymentMethod` | Payment submitted |
| `payment_completed` | `transactionId`, `amount`, `currency`, `paymentMethod` | Payment successful |
| `payment_failed` | `amount`, `currency`, `paymentMethod`, `error` | Payment failed |
| `wallet_funded` | `amount`, `currency`, `fundingSource` | Wallet funded |
| `wallet_withdrawal_initiated` | `amount`, `currency`, `withdrawalMethod` | Withdrawal started |
| `wallet_withdrawal_completed` | `amount`, `currency`, `transactionId` | Withdrawal completed |

### Subscriptions
| Event | Properties | Description |
|-------|-----------|-------------|
| `subscription_started` | `planId`, `planName`, `billingCycle` | Subscription created |
| `subscription_cancelled` | `planId`, `planName`, `reason` | Subscription cancelled |
| `subscription_renewed` | `planId`, `planName`, `billingCycle` | Subscription renewed |

### Engagement
| Event | Properties | Description |
|-------|-----------|-------------|
| `vote_submitted` | `contestantId`, `amount`, `supervoted` | Vote cast |
| `reward_earned` | `rewardType`, `amount`, `reason` | Reward earned |
| `reward_redeemed` | `rewardType`, `amount`, `redeemedFor` | Reward redeemed |
| `creator_followed` | `creatorId` | Creator followed |
| `creator_tipped` | `creatorId`, `amount`, `currency` | Creator tipped |
| `share_initiated` | `contentId`, `platform` | Share initiated |

### Notifications
| Event | Properties | Description |
|-------|-----------|-------------|
| `notification_received` | `notificationId` | Notification received |
| `notification_clicked` | `notificationId` | Notification clicked |
| `notification_opened` | `notificationId` | Notification opened |

### Gaming
| Event | Properties | Description |
|-------|-----------|-------------|
| `game_started` | `gameId` | Game started |
| `game_completed` | `gameId`, `score` | Game completed |
| `prediction_placed` | `predictionId`, `answer` | Prediction submitted |

### Homepage
| Event | Properties | Description |
|-------|-----------|-------------|
| `homepage_section_viewed` | `sectionId`, `sectionName` | Section viewed |
| `homepage_section_scrolled` | `sectionId`, `scrollDepth` | Section scrolled |
| `homepage_hero_slide_viewed` | `slideIndex`, `contentId` | Hero slide viewed |
| `homepage_hero_slide_clicked` | `slideIndex`, `contentId` | Hero slide clicked |
| `homepage_card_clicked` | `sectionId`, `contentId`, `position` | Card clicked |
| `homepage_section_time_spent` | `sectionId`, `timeSpentMs` | Time spent in section |
| `homepage_version_served` | `isAuthenticated` | Which version served |
| `homepage_accessed` | `path`, `isAuthenticated` | Homepage accessed |
| `homepage_redirected` | `from`, `to`, `reason` | User redirected |

### System
| Event | Properties | Description |
|-------|-----------|-------------|
| `error_occurred` | `error`, `context` | Error occurred |
| `performance_${metricName}` | `value` | Performance metric |

## API Reference

### `AzeeboAnalytics`

#### Constructor
```typescript
new AzeeboAnalytics(config?: AnalyticsConfig)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable tracking |
| `debug` | `boolean` | `false` | Enable debug logging |
| `endpoint` | `string` | - | Analytics endpoint URL |
| `flushInterval` | `number` | `30000` | Flush interval in ms |
| `flushBatchSize` | `number` | `10` | Events per batch |
| `consentCategories` | `Record<ConsentCategory, boolean>` | - | Initial consent state |

#### Methods
- `track(event: AnalyticsEvent)` - Track a custom event
- `setUserId(userId: string)` - Set user identity
- `clearUser()` - Clear user identity
- `setConsent(category, granted)` - Update consent
- `hasConsent(category)` - Check consent status
- `flush()` - Force flush event queue
- `destroy()` - Cleanup and flush

## Ownership

- **Team**: Data Engineering
- **Maintainer**: analytics@azeeboplus.com
- **Last Updated**: 2026-07-14
