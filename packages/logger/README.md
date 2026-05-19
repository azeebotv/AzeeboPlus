# @azeebo/logger

Shared logging utilities for Azeebo+ services.

## Features

- **Structured Logging**: JSON-based structured logging for production
- **Request ID Injection**: Automatic request ID tracking via NestJS interceptor
- **NestJS Integration**: Seamless integration with NestJS applications

## Usage

```typescript
import { LoggingInterceptor } from '@azeebo/logger';

// In your NestJS module
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },
];
```

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: backend@azeebo.com
- **Last Updated**: 2026-05-11