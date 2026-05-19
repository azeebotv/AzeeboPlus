# Azeebo+ Wallet Service

## Overview

The Wallet Service manages user wallets, transactions, and fund transfers for the Azeebo+ platform. It provides secure financial operations with proper audit trails.

## Features

- **Wallet Management**: Create and manage user wallets
- **Funding**: Deposit funds into wallets
- **Withdrawals**: Withdraw funds to bank accounts
- **Transfers**: P2P transfers between users
- **Transaction History**: Complete transaction tracking
- **Audit Trail**: Comprehensive audit logging

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **API Docs**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis

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

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet | Get current user's wallet |
| POST | /wallet/fund | Fund wallet |
| POST | /wallet/withdraw | Withdraw funds |
| POST | /wallet/transfer | Transfer to another user |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet/transactions | Get transaction history |
| GET | /wallet/transactions/:id | Get transaction details |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness probe |
| GET | /live | Liveness probe |

## Configuration

```bash
PORT=3011
DATABASE_URL="postgresql://user:password@localhost:5432/wallet"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret"
```

## Security

- All endpoints require authentication
- Bank account validation for withdrawals
- Transaction limits per user
- Atomic transactions with rollback
- Comprehensive audit logging

## Testing

```bash
npm test
```

**Last Updated:** 2026-05-19
