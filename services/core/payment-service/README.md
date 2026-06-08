# Azeebo+ Payment Service

## Overview

The Payment Service handles all payment processing for the Azeebo+ platform. It integrates with multiple payment providers and manages payment verification, refunds, and webhooks.

## Features

- **Payment Processing**: Multi-provider payment handling
- **Payment Verification**: Transaction confirmation
- **Refunds**: Process refund requests
- **Webhooks**: Handle payment provider webhooks
- **Payment History**: Track payment transactions

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payment Providers**: Paystack, Flutterwave
- **API Docs**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Installation

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

### Running the Service

```bash
npm run start:dev
```

## API Endpoints

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/initialize | Initialize payment |
| POST | /payments/verify | Verify payment |
| GET | /payments/history | Get payment history |
| GET | /payments/:id | Get payment details |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/webhooks/paystack | Paystack webhook |
| POST | /payments/webhooks/flutterwave | Flutterwave webhook |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /live | Liveness probe |

## Configuration

```bash
PORT=3014
DATABASE_URL="postgresql://user:password@localhost:5432/payments"
JWT_SECRET="your-secret"

# Payment Providers
PAYSTACK_SECRET="paystack-secret"
FLUTTERWAVE_SECRET="flutterwave-secret"
```

## Security

- Webhooks are cryptographically signed
- All payment amounts verified server-side
- Idempotent webhook handling
- Comprehensive logging

## Testing

```bash
npm test
```

**Last Updated:** 2026-05-19
