# Azeebo+ Authentication Service

## Overview

The Authentication Service handles all user authentication and authorization for the Azeebo+ platform. It provides secure login, registration, and session management.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Password Management**: Password reset and recovery
- **Email Verification**: Account verification flow
- **Multi-Factor Authentication**: Optional MFA for enhanced security
- **OAuth Integration**: Social login support (Google, Apple)
- **Session Management**: Secure session tracking and invalidation

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **JWT**: JsonWebToken
- **API Docs**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (for rate limiting)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | Register new user |
| POST | /auth/login | Login with email/password |
| DELETE | /auth/logout | Logout (invalidate tokens) |
| POST | /auth/refresh | Refresh access token |

### Password Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password with token |

### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/verify-email | Verify email address |
| POST | /auth/resend-verification | Resend verification email |

### MFA

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/mfa/setup | Setup MFA |
| POST | /auth/mfa/verify | Verify MFA code |
| POST | /auth/mfa/enable | Enable MFA |
| POST | /auth/mfa/disable | Disable MFA |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/social/google | Google OAuth login |
| POST | /auth/social/apple | Apple OAuth login |
| POST | /auth/social/unlink | Unlink social account |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /live | Liveness probe |

## Configuration

### Environment Variables

```bash
# Server
PORT=3010

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/auth"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="password"
```

## Security

- **JWT Tokens**: Short-lived access tokens (15 min)
- **Refresh Tokens**: Long-lived refresh tokens (7 days)
- **Rate Limiting**: 5 requests/minute for auth endpoints
- **Password Hashing**: bcrypt with salt rounds
- **Email Verification**: Required for new accounts
- **MFA**: Optional but recommended for sensitive actions

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:cov
```

## Deployment

### Docker

```bash
docker build -t azeebo/auth-service .
docker run -p 3010:3010 azeebo/auth-service
```

## License

Proprietary and confidential.

**Last Updated:** 2026-05-19
