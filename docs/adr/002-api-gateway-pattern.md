# ADR-002: API Gateway Pattern

## Status

Accepted

## Context

The Azeebo+ platform has 29 backend services that need to be accessed by frontend applications. We needed a unified entry point that handles authentication, rate limiting, request routing, and cross-cutting concerns.

## Decision

We will implement an API Gateway pattern using NestJS.

### Architecture

```
Client → API Gateway (3013) → Backend Services (3000-3028)
```

### Responsibilities

1. **Request Routing:** Route requests to appropriate services
2. **Authentication:** Validate JWT tokens and session management
3. **Rate Limiting:** Protect services from abuse
4. **CORS:** Handle cross-origin requests
5. **Logging:** Centralized request/response logging
6. **Metrics:** Collect performance metrics
7. **Feature Flags:** Manage feature toggles

### Service Discovery

Services are registered in the gateway with:
- Service name
- Base URL
- Health check endpoint
- Supported routes

## Consequences

### Positive

- Single entry point for clients
- Centralized cross-cutting concerns
- Simplified client-side API calls
- Better security posture
- Easier monitoring and logging

### Negative

- Single point of failure (mitigated with health checks)
- Additional network hop
- Potential bottleneck (mitigated with rate limiting)

## Alternatives Considered

1. **Direct Service Access:** Clients call services directly
   - Rejected due to security and complexity concerns

2. **Service Mesh:** Use Istio/Linkerd for service-to-service communication
   - Rejected as overkill for current scale

## References

- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [NestJS Documentation](https://docs.nestjs.com/)
