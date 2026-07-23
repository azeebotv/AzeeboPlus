# Auth System — Product Spec

## Purpose
Secure authentication and authorization for all platform users.

## Core Features
- Email/password registration and login
- OTP verification (email)
- OAuth (Google, Apple)
- JWT access + refresh tokens
- Role-based access control (user, creator, admin, superadmin)
- MFA support
- Device management
- Password reset

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | Register |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout |
| POST | /auth/refresh | Refresh token |
| GET | /auth/me | Get current user |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password |
| POST | /auth/verify-email | Verify email |
| POST | /auth/resend-verification | Resend verification |
| POST | /auth/select-role | Select user role |
| GET | /mfa/setup | Setup MFA |
| POST | /mfa/verify | Verify MFA |
| POST | /mfa/enable | Enable MFA |
| POST | /mfa/disable | Disable MFA |
| GET | /auth/social/google/authorize | Google OAuth |
| POST | /auth/social/callback | OAuth callback |
| GET | /auth/devices | List devices |
| DELETE | /auth/devices/:deviceId | Remove device |

## Security
- JWT access token: 15min expiry
- Refresh token: 7d expiry with rotation
- bcrypt with 10 salt rounds
- Rate limiting: 10 login attempts/min, 3 registrations/hour
- Internal API key for service-to-service calls

## Status
- [x] Backend service implemented
- [x] Mobile auth flow implemented
- [x] Web auth flow implemented
