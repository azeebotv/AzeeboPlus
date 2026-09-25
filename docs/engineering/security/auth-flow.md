# Authentication Flow

## Overview
Azeebo+ uses JWT-based authentication with refresh token rotation.

## Flow
1. User registers/logs in via auth-service
2. Auth-service issues JWT access token (15min) + refresh token (7d)
3. API Gateway validates JWT on every request
4. Services receive decoded user context from gateway
5. Refresh token rotation on each use

## Token Storage
- **Mobile:** SecureStore for tokens, AsyncStorage for user profile
- **Web:** httpOnly cookies (admin/creator), localStorage (mobile shared library)
- **Admin/Creator:** httpOnly cookies via `/api/v1/auth/cookie`

## Roles
| Role | Permissions |
|------|------------|
| user | Standard platform access |
| creator | + Content upload, creator dashboard |
| admin | + Admin panel access |
| moderator | + Moderation tools |
| superadmin | Full system access |

## Security Measures
- bcrypt with 10 salt rounds
- Rate limiting: 10 login/min, 3 register/hour, 5 OTP/15min
- Refresh token rotation
- Token revocation on logout
- Session timeout: 30 minutes inactivity
- CSRF protection via double-submit cookie
- Internal API key for service-to-service calls
