# @azeebo/api-client

Shared typed API client for Azeebo+ services with built-in retries, timeouts, idempotency, and trace headers.

## Features

- **Automatic Retries**: Configurable retry logic for transient errors (429, 5xx, timeouts)
- **Idempotency**: Automatic idempotency key generation for safe retries
- **Trace Headers**: Built-in request tracing with X-Request-Id and X-Trace-Id
- **Timeout Handling**: Configurable request timeouts
- **Type Safety**: Full TypeScript support with generic response types
- **Token Management**: Built-in authorization token handling

## Usage

```typescript
import { createApiClient } from '@azeebo/api-client';

const client = createApiClient({
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  retryConfig: {
    retries: 3,
    delay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  },
});

const response = await client.get<User>('/api/users/123');
if (response.success) {
  console.log(response.data);
}
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| baseUrl | string | - | Required base URL for the API |
| timeout | number | 30000 | Request timeout in milliseconds |
| retryConfig.retries | number | 3 | Maximum retry attempts |
| retryConfig.delay | number | 1000 | Initial retry delay in ms |
| retryConfig.maxDelay | number | 10000 | Maximum retry delay |
| retryConfig.backoffFactor | number | 2 | Exponential backoff factor |
| tokenStorage | TokenStorage | localStorage | Custom token storage implementation |

## Methods

- `get<T>(url, config)` - GET request
- `post<T>(url, data, config)` - POST request
- `put<T>(url, data, config)` - PUT request
- `patch<T>(url, data, config)` - PATCH request
- `delete<T>(url, config)` - DELETE request
- `withIdempotencyKey(key)` - Chainable method to set custom idempotency key
- `withTraceHeader(traceId)` - Chainable method to set custom trace ID

## Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: backend@azeebo.com
- **Last Updated**: 2026-05-11