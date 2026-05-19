# Azeebo+ API Gateway Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines API Gateway standards for the Azeebo+ platform, including routing, authentication, rate limiting, and request/response transformation.

---

## API Gateway Overview

### Purpose

The API Gateway serves as the single entry point for all client requests, providing:

- Request routing to backend services
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- Caching
- Logging and monitoring

### Technology Stack

| Component | Technology | Enforcement |
|-----------|-----------|-------------|
| Gateway | NGINX / Traefik / Kong | MUST |
| Auth | JWT validation | MUST |
| Rate Limiting | Redis-based | MUST |
| Caching | Redis / CDN | SHOULD |
| Observability | OpenTelemetry | MUST |

---

## Gateway Architecture

```
Client → API Gateway → Backend Services
              ↓
         - Auth
         - Rate Limit
         - Logging
         - Routing
```

### Gateway Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Authentication | Validate JWT tokens |
| Authorization | Check RBAC permissions |
| Rate Limiting | Enforce request limits |
| Routing | Route to appropriate service |
| Transformation | Transform request/response |
| Caching | Cache responses where applicable |
| Logging | Log all requests |
| Monitoring | Expose metrics |

---

## Authentication & Authorization

### JWT Validation

```typescript
// ✅ Good - Gateway JWT Validation
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      req.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Token Requirements

| Requirement | Description |
|-------------|-------------|
| Short-lived | Access tokens: 15-30 min |
| Refresh tokens | Rotate on use |
| Revocation | Support token revocation |
| Claims | Include all required claims |

### Required JWT Claims

```json
{
  "iss": "auth-service",
  "sub": "user-123",
  "aud": ["web-app", "mobile-app", "admin-panel"],
  "exp": 1682160600,
  "iat": 1682160300,
  "jti": "token-uuid",
  "roles": ["user", "creator"],
  "permissions": ["view:content", "create:upload"],
  "universe": "reality"
}
```

---

## Rate Limiting

### Rate Limit Strategy

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth endpoints | 10 req/min | Per IP + User |
| Payment endpoints | 20 req/min | Per User |
| General API | 100 req/min | Per User |
| Public endpoints | 1000 req/min | Per IP |

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Reset timestamp |
| `Retry-After` | Seconds until retry (if limited) |

### Rate Limit Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset": "2026-04-23T10:31:00.000Z"
    }
  }
}
```

### Gateway Rate Limit Configuration

```nginx
# NGINX rate limiting
http {
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
  limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

  server {
    location /api/ {
      limit_req zone=api_limit burst=20 nodelay;
      limit_req_status 429;
      proxy_pass http://backend;
    }

    location /api/auth/ {
      limit_req zone=auth_limit burst=5 nodelay;
      limit_req_status 429;
      proxy_pass http://auth-service;
    }
  }
}
```

---

## Request Routing

### Route Configuration

```typescript
// ✅ Good - Gateway Routes
interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  version: string;
  auth?: boolean;
  rateLimit?: string;
}

const routes: RouteConfig[] = [
  {
    path: '/auth/*',
    method: '*',
    service: 'auth-service',
    version: 'v1',
    auth: false,
  },
  {
    path: '/users/*',
    method: '*',
    service: 'user-service',
    version: 'v1',
    auth: true,
  },
  {
    path: '/wallet/*',
    method: '*',
    service: 'wallet-service',
    version: 'v1',
    auth: true,
  },
  {
    path: '/payments/*',
    method: '*',
    service: 'payment-service',
    version: 'v1',
    auth: true,
  },
  {
    path: '/content/*',
    method: 'GET',
    service: 'content-service',
    version: 'v1',
    auth: false,
  },
  {
    path: '/content/*',
    method: '*',
    service: 'content-service',
    version: 'v1',
    auth: true,
  },
];
```

### Service Discovery

```typescript
// ✅ Good - Service Discovery
interface ServiceInstance {
  host: string;
  port: number;
  health: 'healthy' | 'unhealthy';
  version: string;
}

class ServiceDiscovery {
  private services: Map<string, ServiceInstance[]> = new Map();

  async getService(serviceName: string): Promise<ServiceInstance> {
    const instances = this.services.get(serviceName);
    if (!instances || instances.length === 0) {
      throw new Error(`No instances found for service: ${serviceName}`);
    }

    // Simple round-robin
    const instance = instances.shift();
    instances.push(instance);
    return instance;
  }

  async updateHealth(serviceName: string, host: string, port: number, health: 'healthy' | 'unhealthy'): Promise<void> {
    const instances = this.services.get(serviceName) || [];
    const instance = instances.find((i) => i.host === host && i.port === port);
    if (instance) {
      instance.health = health;
    }
  }
}
```

---

## Request/Response Transformation

### Request Transformation

```typescript
// ✅ Good - Request Transformer
interface RequestTransformer {
  transform(req: Request): Request;
}

class AuthRequestTransformer implements RequestTransformer {
  transform(req: Request): Request {
    // Add trace context
    req.headers['x-trace-id'] = req.headers['x-trace-id'] || crypto.randomUUID();
    req.headers['x-span-id'] = crypto.randomUUID().substring(0, 16);

    // Add user context if authenticated
    if (req.user) {
      req.headers['x-user-id'] = req.user.id;
      req.headers['x-user-roles'] = req.user.roles?.join(',');
    }

    return req;
  }
}
```

### Response Transformation

```typescript
// ✅ Good - Response Transformer
interface ResponseTransformer {
  transform(res: Response): Response;
}

class StandardResponseTransformer implements ResponseTransformer {
  transform(res: Response): Response {
    // Standardize error responses
    if (res.statusCode >= 400) {
      return {
        ...res,
        body: {
          success: false,
          error: {
            code: res.body?.error?.code || 'INTERNAL_ERROR',
            message: res.body?.error?.message || 'An error occurred',
            details: res.body?.error?.details,
          },
        },
      };
    }

    // Standardize success responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {
        ...res,
        body: {
          success: true,
          data: res.body,
        },
      };
    }

    return res;
  }
}
```

---

## Caching

### Cache Strategy

| Endpoint Type | TTL | Cache Control |
|---------------|-----|---------------|
| Public content | 5 min | public, max-age=300 |
| User-specific | 0 | no-cache |
| Static assets | 1 hour | public, max-age=3600 |
| API responses | 1 min | private, max-age=60 |

### Cache Headers

| Header | Description |
|--------|-------------|
| `Cache-Control` | Cache directives |
| `ETag` | Resource version |
| `Last-Modified` | Last modification time |
| `X-Cache` | Cache hit/miss status |

### Gateway Cache Configuration

```nginx
# NGINX caching
http {
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

  server {
    location /api/content/ {
      proxy_cache api_cache;
      proxy_cache_valid 200 5m;
      proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
      add_header X-Cache $upstream_cache_status;
      proxy_pass http://content-service;
    }
  }
}
```

---

## Security Headers

### Required Headers

| Header | Value | Description |
|--------|-------|-------------|
| `X-Content-Type-Options` | nosniff | Prevent MIME type sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 1; mode=block | Enable XSS filter |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains | HSTS |
| `Content-Security-Policy` | default-src 'self' | CSP |
| `Referrer-Policy` | strict-origin-when-cross-origin | Referrer control |
| `Permissions-Policy` | geolocation=(), microphone=() | Feature policy |

### Gateway Security Configuration

```nginx
# NGINX security headers
server {
  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options DENY always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header Content-Security-Policy "default-src 'self'" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), microphone=()" always;
}
```

---

## Logging

### Gateway Log Format

```json
{
  "timestamp": "2026-04-23T10:30:00.000Z",
  "level": "INFO",
  "traceId": "abc-123-def",
  "spanId": "span-789",
  "service": "api-gateway",
  "message": "Request processed",
  "request": {
    "method": "GET",
    "path": "/api/users/me",
    "query": {},
    "headers": {
      "authorization": "Bearer ***",
      "x-trace-id": "abc-123-def"
    },
    "clientIp": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "response": {
    "statusCode": 200,
    "duration": 45,
    "size": 1024
  },
  "metadata": {
    "userId": "user-123",
    "service": "user-service"
  }
}
```

---

## Health Checks

### Gateway Health Endpoint

```typescript
// ✅ Good
@Controller('health')
export class GatewayHealthController {
  constructor(
    private readonly discoveryService: ServiceDiscovery,
  ) {}

  @Get()
  @HttpCode(200)
  async check(): Promise<HealthCheck> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  }

  @Get('ready')
  @HttpCode(200)
  async readiness(): Promise<ReadinessCheck> {
    const services = ['auth-service', 'user-service', 'wallet-service'];
    const checks = await Promise.all(
      services.map(async (service) => {
        try {
          const instance = await this.discoveryService.getService(service);
          return {
            name: service,
            status: 'ok',
            host: instance.host,
            port: instance.port,
          };
        } catch (error) {
          return {
            name: service,
            status: 'error',
            error: error.message,
          };
        }
      }),
    );

    const allHealthy = checks.every((check) => check.status === 'ok');

    return {
      status: allHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": {
      "field": "email",
      "reason": "User not found"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid login credentials |
| `AUTH_TOKEN_EXPIRED` | 401 | Token has expired |
| `AUTH_TOKEN_INVALID` | 401 | Token is invalid |
| `AUTH_MFA_REQUIRED` | 403 | MFA is required |
| `AUTH_ACCOUNT_LOCKED` | 403 | Account is locked |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `SERVICE_UNAVAILABLE` | 503 | Backend service unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Gateway Latency (p95) | < 50ms |
| Auth Validation Time | < 10ms |
| Rate Limit Check | < 5ms |
| Cache Hit Rate | > 80% |
| Error Rate | < 0.1% |

---

## Prohibited Actions

- No bypassing authentication
- No disabling rate limiting
- No logging sensitive data
- No caching authenticated responses
- No direct backend access
- No hardcoded secrets
- No disabling security headers