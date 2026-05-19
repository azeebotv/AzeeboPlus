# @azeebo/security

Shared security utilities for Azeebo+ services.

## Features

- **Rate Limiting**: Redis-backed rate limiting guard
- **CORS Configuration**: Standardized CORS configuration
- **Helmet**: Security headers via Helmet middleware
- **Request ID**: Request ID generation middleware

## Usage

```typescript
import { RateLimitGuard, CorsConfig, HelmetConfig } from '@azeebo/security';

// Apply rate limiting guard
@UseGuards(RateLimitGuard)
@Controller('api')
export class MyController {}
```

## Ownership

- **Team**: Security Engineering
- **Maintainer**: security@azeebo.com
- **Last Updated**: 2026-05-11