# Auth Service — API Reference

> Port: 3000 | Database: azeebo_auth

## Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | Register new user |
| POST | /auth/login | Login |
| POST | /auth/logout | Logout (revokes refresh token) |
| POST | /auth/refresh | Refresh access token |
| GET | /auth/me | Get current user |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password |
| POST | /auth/verify-email | Verify email with OTP |
| POST | /auth/resend-verification | Resend verification OTP |
| POST | /auth/select-role | Select user role (user/creator) |

### MFA
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /mfa/setup | Setup MFA (returns secret) |
| POST | /mfa/verify | Verify MFA code |
| POST | /mfa/enable | Enable MFA |
| POST | /mfa/disable | Disable MFA |

### Social Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/social/google/authorize | Google OAuth redirect |
| GET | /auth/social/apple/authorize | Apple OAuth redirect |
| POST | /auth/social/callback | OAuth callback |
| POST | /auth/social/unlink | Unlink social account |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/devices | List registered devices |
| DELETE | /auth/devices/:deviceId | Remove device |
| PATCH | /auth/devices/:deviceId | Update device |
| POST | /auth/devices/revoke-all | Revoke all devices |

### OTP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /otp/send | Send OTP |
| POST | /otp/verify | Verify OTP |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/stats | Get auth stats |
| GET | /admin/users | List users |
| GET | /admin/users/:id | Get user details |
| POST | /admin/users/:id/suspend | Suspend user |
| POST | /admin/users/:id/activate | Activate user |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /health/live | Liveness |
| GET | /health/ready | Readiness |
