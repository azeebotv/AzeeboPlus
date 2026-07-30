# Wallet System — Product Spec

## Purpose
Virtual wallet for all platform transactions.

## Core Features
- Virtual wallet per user (NGN balance)
- Atomic transactions with row-level locking
- Immutable ledger with state machine (pending → completed/failed)
- Idempotent operations via idempotencyKey
- Fund wallet (Paystack/Flutterwave)
- Withdraw funds
- Transfer between users
- Transaction history

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet | Get balance |
| GET | /wallet/transactions | List transactions |
| GET | /wallet/summary | Get summary |
| POST | /wallet/fund | Fund wallet |
| POST | /wallet/withdraw | Withdraw funds |
| POST | /wallet/transfer | Transfer funds |
| POST | /wallet/debit | Debit (service-to-service) |
| POST | /wallet/credit | Credit (service-to-service) |
| POST | /wallet/redeem-reward | Redeem reward |

## Security
- Redis distributed lock (5s TTL)
- Prisma `SELECT ... FOR UPDATE`
- All operations idempotent
- Atomic debit + ledger entry + event emission

## Status
- [x] Backend service implemented
- [x] Mobile wallet screens implemented
- [x] Web wallet pages implemented
