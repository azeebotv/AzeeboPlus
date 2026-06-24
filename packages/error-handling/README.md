# @azeebo/error-handling

Shared error handling utilities for Azeebo+ services.

## Features

- **Global Exception Filter**: Standardized error handling for NestJS
- **Error Types**: Common error types and error codes
- **Response Formatting**: Consistent error response formatting

## Usage

```typescript
import { GlobalExceptionFilter } from '@azeebo/error-handling';

// In your main.ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: backend@azeeboplus.com
- **Last Updated**: 2026-05-11