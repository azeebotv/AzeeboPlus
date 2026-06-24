# @azeebo/shared-types

Shared TypeScript types and utilities for Azeebo+ services.

## Contents

- **API Response Wrapper**: Standardized response envelope for all API endpoints
- **API Versioning**: Types and utilities for API version management
- **Circuit Breaker**: Circuit breaker pattern implementation
- **Environment Validation**: Environment variable validation utilities

## Usage

```typescript
import { ApiResponseWrapper } from '@azeebo/shared-types';

// Success response
return ApiResponseWrapper.success(data);

// Error response
return ApiResponseWrapper.error('ERROR_CODE', 'Human readable message');

// Paginated response
return ApiResponseWrapper.paginated(data, page, limit, total);
```

## Response Format

```typescript
// Success
{ success: true, data: {...}, meta?: { page, limit, total, totalPages } }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: '...', details?: {...} } }
```

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: backend@azeeboplus.com
- **Last Updated**: 2026-05-11