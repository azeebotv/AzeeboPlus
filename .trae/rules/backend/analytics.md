# Azeebo+ Analytics Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Analytics Overview

Azeebo+ uses a comprehensive analytics system to track user behavior, measure product metrics, and drive data-informed decisions.

---

## Event Tracking

### Event Naming Convention

Event names MUST use `snake_case`:
```
✅ user_signup_completed
✅ content_view_started
✅ payment_processed
❌ userSignupCompleted
❌ ContentViewStarted
```

### Required Funnel Events

Every conversion funnel MUST track:

| Stage | Event | Data |
|-------|-------|------|
| 1. View | `{action}_viewed` | user_id, timestamp |
| 2. Submit | `{action}_submitted` | user_id, data |
| 3. Success | `{action}_completed` | user_id, result |
| 4. Failure | `{action}_failed` | user_id, error |

### Examples

- `payment_viewed` → `payment_submitted` → `payment_completed`
- `content_viewed` → `content_liked` → `content_shared`

---

## Standard Event Types

| Event | Description |
|-------|-------------|
| `screen_view` | User views a screen |
| `content_impression` | Content appears in viewport |
| `content_click` | User clicks on content |
| `play_start` | Video/audio playback starts |
| `play_complete` | Video/audio playback completes |
| `vote_initiated` | User starts voting flow |
| `vote_completed` | Vote is submitted |
| `payment_initiated` | User starts payment |
| `payment_success` | Payment completed |
| `payment_failure` | Payment failed |
| `reward_earned` | User earns reward |
| `reward_redeemed` | User redeems reward |
| `creator_followed` | User follows creator |
| `creator_tipped` | User tips creator |
| `prediction_submitted` | User submits prediction |
| `game_started` | User starts game |
| `game_completed` | User completes game |
| `share_initiated` | User shares content |
| `notification_opened` | User opens notification |

---

## Event Envelope

Every event MUST include:

```typescript
interface EventEnvelope {
  user_id: string;
  session_id: string;
  platform: 'mobile' | 'web' | 'admin';
  universe: Universe;
  content_id?: string;
  timestamp: string; // ISO 8601
  device_info: {
    device_id: string;
    device_type: string;
    os_version: string;
    app_version: string;
  };
  experiment_flags?: Record<string, string>;
}
```

---

## Analytics Privacy

### MUST NOT Include

- Secrets or API keys
- Passwords or tokens
- PII (unless anonymized)
- Payment details
- Full user profiles

### Requirements

- All events MUST be anonymizable
- Comply with GDPR
- Have retention policies
- Support data deletion requests

---

## Analytics Architecture

### Data Flow

```
App/Website → Event Collector → Stream Processor → 
  ├── Real-time Dashboard
  ├── Data Warehouse
  └── ML Pipeline
```

### Tools

| Purpose | Tool |
|---------|------|
| Event Collection | Firebase / Custom SDK |
| Stream Processing | Kafka / Kinesis |
| Data Warehouse | BigQuery / Snowflake |
| Visualization | Looker / Metabase |
| Experimentation | Statsig / Optimizely |

---

## Key Metrics

### User Metrics

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session count per user
- Time in app
- Retention rate (D1, D7, D30)

### Engagement Metrics

- Content views
- Watch time
- Vote participation rate
- Prediction submission rate
- Game completion rate

### Revenue Metrics

- Total transaction value
- Average revenue per user (ARPU)
- Conversion rate
- Cart abandonment rate
- Refund rate

### Creator Metrics

- Creator signups
- Content uploads
- Follower growth
- Earnings distribution
- Top creators

---

## Universe-Specific Metrics

### Reality Universe

- Show views
- Vote participation
- Supervote usage
- Prediction accuracy
- Leaderboard engagement

### Creator Universe

- Upload views
- Subscription conversion
- Tip amounts
- Creator earnings

### Movie Universe

- Rental conversions
- Pass purchases
- Premiere attendance
- Watchlist usage

### Games Universe

- Game starts
- Completion rate
- Tournament entries
- Score distributions

### Sports Universe

- Prediction participation
- Contest entries
- Highlight views

---

## Dashboard Requirements

### Executive Dashboard

- DAU/MAU trends
- Revenue overview
- Top content
- Creator metrics
- System health

### Universe Dashboards

- Universe-specific KPIs
- Funnel analysis
- User journey maps
- A/B test results

### Creator Dashboard

- Performance metrics
- Earnings summary
- Audience insights
- Content analytics

---

## Experimentation

### A/B Testing

- Feature flags
- Randomization
- Statistical significance
- Guardrail metrics

### Test Types

- Feature tests
- UI/UX tests
- Pricing tests
- Algorithm tests

---

## Prohibited Actions

- Tracking PII without consent
- Storing raw sensitive data
- Using analytics for profiling
- Sharing data with third parties without consent