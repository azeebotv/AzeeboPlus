# Azeebo+ API Versioning Strategy

## Overview

This document outlines the API versioning strategy for the Azeebo+ platform. Versioning is essential to maintain backward compatibility while allowing the API to evolve over time.

## Versioning Approach

### URL-Based Versioning

Azeebo+ uses URL-based versioning with a `/v{version}` prefix:

```
https://api.azeebo.com/v1/users/me
https://api.azeebo.com/v2/users/me
```

### Current Version

- **Current Stable Version:** `v1`
- **Next Version:** `v2` (in development)

## Version Lifecycle

| Stage | Description | Duration |
|-------|-------------|----------|
| **Development** | New features being developed | N/A |
| **Beta** | Public testing with limited users | 2-4 weeks |
| **Stable** | Production-ready, recommended for all clients | Until next major release |
| **Deprecated** | No longer recommended, security patches only | 6 months |
| **Retired** | No longer available | N/A |

## Version Compatibility

### Breaking Changes (Major Version)

Breaking changes require a new major version:
- Removing an endpoint
- Changing request/response schema
- Changing authentication requirements
- Removing or renaming fields
- Changing HTTP status codes

### Non-Breaking Changes (Minor/Patch)

These changes can be made within the same major version:
- Adding new endpoints
- Adding new optional fields to responses
- Adding new query parameters
- Bug fixes that don't change behavior
- Performance improvements

## Version Migration Guide

### Migrating from v1 to v2

#### Breaking Changes in v2

1. **Authentication**
   - JWT token format changed
   - Old tokens will continue to work for 30 days after v2 release

2. **Wallet Endpoints**
   - `/v1/wallet` → `/v2/wallet/balance`
   - `/v1/wallet/transactions` → `/v2/wallet/transactions`

3. **Response Format**
   - All responses now include a `meta` object for pagination
   - Error responses have a new structure

#### Deprecated Endpoints in v2

| v1 Endpoint | v2 Replacement |
|-------------|---------------|
| `GET /v1/content/featured` | `GET /v2/content?type=featured` |
| `GET /v1/creators/discover` | `GET /v2/creators?discover=true` |

### Migration Steps

1. Update API client to use v2 endpoints
2. Update authentication handling for new token format
3. Update response parsing to handle new schema
4. Test all integrations in staging environment
5. Deploy to production

## API Gateway Configuration

The API gateway handles version routing:

```yaml
routes:
  - path: /v1/*
    service: azeebo-v1-services
    timeout: 30s
  
  - path: /v2/*
    service: azeebo-v2-services
    timeout: 30s
  
  - path: /*
    service: azeebo-v1-services
    timeout: 30s
```

## Client Implementation

### Version Header

Clients can optionally specify version via header:

```http
GET /users/me
X-API-Version: 2
```

### Fallback Behavior

- If no version is specified, the gateway defaults to v1
- Invalid versions return `400 Bad Request`

## Deprecation Policy

- Deprecated endpoints will return a `Deprecation` header:
  ```http
  Deprecation: true
  Sunset: 2026-12-31
  Link: <https://docs.azeebo.com/api/migration>; rel="deprecation"
  ```

- Deprecated endpoints remain available for 6 months after deprecation notice

## Version Matrix

| Service | v1 Status | v2 Status |
|---------|-----------|-----------|
| Auth | ✅ Stable | ⚙️ Development |
| Wallet | ✅ Stable | ⚙️ Development |
| Payments | ✅ Stable | ⚙️ Development |
| Content | ✅ Stable | ⚙️ Development |
| Users | ✅ Stable | ⚙️ Development |
| Analytics | ✅ Stable | ✅ Beta |
| Recommendations | ✅ Stable | ✅ Beta |
| Notifications | ✅ Stable | ⚙️ Development |

## Best Practices

1. **Lock to a version** - Clients should explicitly specify the API version
2. **Monitor deprecation headers** - Handle deprecated endpoints proactively
3. **Test against staging** - Always test version upgrades in staging first
4. **Use versioned SDKs** - Use official SDKs that handle versioning automatically
5. **Plan migrations** - Schedule version upgrades during low-traffic periods

## Future Considerations

- **Date-based versioning** for rapid-release services
- **Semantic versioning** for API clients
- **GraphQL schema versioning** for future GraphQL APIs

## References

- [API_ROUTE_MAP.md](API_ROUTE_MAP.md)
- [ERROR_CODES.md](ERROR_CODES.md)

**Last Updated:** 2026-05-19  
**Version:** 1.0
