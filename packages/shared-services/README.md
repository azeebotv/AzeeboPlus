# @azeebo/shared-services

Shared NestJS services for Azeebo+ backend — Prisma, Redis, Auth, Audit, and more.

## Features

- `PrismaService` — Prisma client with connection pooling
- `RedisService` — Redis client with pub/sub support
- `AuthService` — JWT token validation and user extraction
- `AuditService` — Audit logging for compliance
- `EmailService` — Transactional email sending
- `SmsService` — SMS notification sending
- `FirebaseService` — Push notification delivery
- `SentryService` — Error tracking integration
- `AnalyticsService` — Event tracking
- `RolesGuard` — Role-based access control

## Usage

```ts
import { PrismaService, AuthService } from '@azeebo/shared-services';

@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}
}
```

## Exports

| Export | Description |
|--------|-------------|
| `PrismaService` | Prisma client service |
| `RedisService` | Redis client service |
| `AuthService` | JWT auth service |
| `AuditService` | Audit logging |
| `EmailService` | Email sending |
| `SmsService` | SMS sending |
| `FirebaseService` | Push notifications |
| `SentryService` | Error tracking |
| `AnalyticsService` | Event tracking |
| `RolesGuard` | RBAC guard |
| `Roles` | Role decorator |
