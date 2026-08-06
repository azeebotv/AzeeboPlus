# @azeebo/http-client

Unified HTTP client for Azeebo+ with retry, idempotency, and typed service clients.

## Features

- Automatic retry with exponential backoff
- Idempotency key management
- Typed service clients (ContentServiceClient, UserServiceClient, etc.)
- Request/response interceptors
- Timeout handling

## Usage

```ts
import { ContentServiceClient } from '@azeebo/http-client';

const client = new ContentServiceClient({
  baseUrl: process.env.CONTENT_SERVICE_URL,
  apiKey: process.env.INTERNAL_API_KEY,
});

const content = await content.getContent('123');
```

## Exports

| Export | Description |
|--------|-------------|
| `HttpClient` | Base HTTP client with retry and idempotency |
| `ContentServiceClient` | Typed client for content-service |
| `UserServiceClient` | Typed client for user-service |
| `PaymentServiceClient` | Typed client for payment-service |
| `AnalyticsServiceClient` | Typed client for analytics-service |
| `NotificationServiceClient` | Typed client for notification-service |
| `MessagingServiceClient` | Typed client for messaging-service |
| `RecommendationServiceClient` | Typed client for recommendation-service |
