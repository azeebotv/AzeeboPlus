# Azeebo+ Authentication Service

> Port: 3000 | Database: `azeebo_auth` | Analytics: Yes

Handles user registration, login, JWT tokens, OAuth, MFA, email verification, OTP, device management, and admin user operations.

## API Endpoints

### Auth (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/logout` | Logout (invalidate tokens) | Yes |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/verify-email` | Verify email address | No |
| POST | `/auth/resend-verification` | Resend verification email | No |
| POST | `/auth/select-role` | Select user role (user/creator) | Yes |

### MFA (`/mfa`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/mfa/setup` | Setup MFA (get QR code) | Yes |
| POST | `/mfa/verify` | Verify MFA code | Yes |
| POST | `/mfa/enable` | Enable MFA | Yes |
| POST | `/mfa/disable` | Disable MFA | Yes |

### Social Auth (`/auth/social`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/social/google/authorize` | Get Google OAuth URL | No |
| GET | `/auth/social/apple/authorize` | Get Apple OAuth URL | No |
| POST | `/auth/social/callback` | Handle OAuth callback | No |
| POST | `/auth/social/unlink` | Unlink social account | Yes |

### Device Management (`/auth/devices`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/devices` | List user devices | Yes |
| DELETE | `/auth/devices/:deviceId` | Remove device | Yes |
| PATCH | `/auth/devices/:deviceId` | Update device | Yes |
| POST | `/auth/devices/revoke-all` | Revoke all devices | Yes |

### OTP (`/otp`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/otp/send` | Send OTP to email/phone | No |
| POST | `/otp/verify` | Verify OTP code | No |

### Admin (`/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Get auth statistics | Admin |
| GET | `/admin/users` | List users (paginated) | Admin |
| GET | `/admin/users/:id` | Get user details | Admin |
| POST | `/admin/users/:id/suspend` | Suspend user | Admin |
| POST | `/admin/users/:id/activate` | Activate user | Admin |

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check (DB + Redis) | No |
| GET | `/health/live` | Liveness probe | No |
| GET | `/health/ready` | Readiness probe | No |

## Events Tracked

| Event | Trigger | Properties |
|-------|---------|------------|
| `user_registered` | Successful signup | email, role |
| `user_logged_in` | Successful login | method |
| `user_login_failed` | Failed login | reason, email |
| `user_logged_out` | Logout | — |
| `user_email_verified` | Email verified | — |
| `user_role_selected` | Role selected | role |

## Configuration

Required env vars (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection | — |
| `REDIS_URL` | Redis connection | — |
| `JWT_ACCESS_SECRET` | JWT signing key (>=32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token signing key | — |
| `ANALYTICS_SERVICE_URL` | Analytics service URL | http://analytics-service:3008 |

## Testing

```bash
pnpm test           # Unit tests
pnpm test:cov       # With coverage
```

## Prisma Models

`User`, `SocialAccount`, `Session`, `Otp`, `Role`, `Permission`, `RolePermission`, `AuditLog`
