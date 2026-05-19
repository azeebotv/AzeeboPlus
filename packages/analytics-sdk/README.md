# @azeebo/analytics-sdk

Shared analytics SDK for Azeebo+ applications.

## Features

- **Event Tracking**: Track user events and actions
- **Analytics Integration**: Integration with analytics providers
- **Standard Events**: Predefined event types following Azeebo standards

## Usage

```typescript
import { AnalyticsSDK } from '@azeebo/analytics-sdk';

const analytics = new AnalyticsSDK();

analytics.track('screen_view', {
  screen_name: 'home',
  universe: 'reality',
  platform: 'web',
});
```

## Event Types

- `screen_view` - User views a screen
- `content_impression` - Content is displayed
- `content_click` - User clicks on content
- `play_start` - Content playback starts
- `play_complete` - Content playback completes
- `login` - User logs in
- `signup` - User signs up
- `payment_success` - Payment succeeds
- `payment_failed` - Payment fails

## Ownership

- **Team**: Data Engineering
- **Maintainer**: analytics@azeebo.com
- **Last Updated**: 2026-05-11