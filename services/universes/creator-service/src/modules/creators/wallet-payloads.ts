/**
 * Wallet request payload builders for the wallet-service internal surface.
 *
 * These are the ONLY places in creator-service that construct bodies for
 * wallet-service's internal wallet endpoints — the payment methods consume
 * these builders, so a payload-shape change here is intentional and visible
 * in one file, and the contract tests in @azeebo/contract-tests validate
 * every builder against wallet-service's real DTO classes.
 *
 * Endpoints (auth: x-internal-api-key):
 *   GET  /v1/internal/wallets/user/:userId            (lookup; auto-creates)
 *   POST /v1/internal/wallets/user/:userId/debit      InternalDebitWalletDto
 *   POST /v1/internal/wallets/user/:userId/credit     InternalCreditWalletDto
 *
 * Wire-true builders: each returns a plain object containing ONLY fields the
 * DTOs declare, so it can be sent as-is (the global ValidationPipe uses
 * forbidNonWhitelisted) and can be asserted against DTO truth in tests.
 */

import type { InternalDebitWalletDto, InternalCreditWalletDto } from './wallet-contract/internal-wallet.dtos.js';

export type InternalDebitPayload = Omit<InternalDebitWalletDto, never>;
export type InternalCreditPayload = Omit<InternalCreditWalletDto, never>;

/** Idempotency key for a tip debit (`tip:from:to:amount`). */
export function tipIdempotencyKey(fromUserId: string, toUserId: string, amount: number): string {
  return `tip:${fromUserId}:${toUserId}:${amount}`;
}

/** Idempotency key for a subscription debit (`subscribe:user:creator:tier`). */
export function subscriptionIdempotencyKey(userId: string, creatorId: string, tier: string): string {
  return `subscribe:${userId}:${creatorId}:${tier}`;
}

/** Debit the tip sender's wallet. */
export function tipDebitPayload(fromUserId: string, toUserId: string, amount: number): InternalDebitPayload {
  return {
    amount,
    description: `Tip to creator ${toUserId}`,
    idempotencyKey: tipIdempotencyKey(fromUserId, toUserId, amount),
  };
}

/** Credit the tip recipient's wallet. */
export function tipCreditPayload(fromUserId: string, toUserId: string, amount: number): InternalCreditPayload {
  return {
    amount,
    description: `Tip from user ${fromUserId}`,
    idempotencyKey: `${tipIdempotencyKey(fromUserId, toUserId, amount)}:credit`,
  };
}

/** Compensate the sender (refund) after a failed tip credit. */
export function tipCompensationPayload(fromUserId: string, toUserId: string, amount: number): InternalCreditPayload {
  return {
    amount,
    description: `Compensation for failed tip credit: ${tipIdempotencyKey(fromUserId, toUserId, amount)}`,
    idempotencyKey: `compensate:${tipIdempotencyKey(fromUserId, toUserId, amount)}`,
  };
}

/** Debit the subscriber's wallet for a premium subscription. */
export function subscriptionDebitPayload(userId: string, creatorId: string, amount: number, tier: string): InternalDebitPayload {
  return {
    amount,
    description: `Subscription to creator ${creatorId} - ${tier}`,
    idempotencyKey: subscriptionIdempotencyKey(userId, creatorId, tier),
  };
}

/** Credit the creator's wallet for a premium subscription. */
export function subscriptionCreditPayload(userId: string, creatorId: string, amount: number, tier: string): InternalCreditPayload {
  return {
    amount,
    description: `Subscription from user ${userId} - ${tier}`,
    idempotencyKey: `${subscriptionIdempotencyKey(userId, creatorId, tier)}:credit`,
  };
}

/** Compensate the subscriber after a failed subscription credit. */
export function subscriptionCompensationPayload(userId: string, creatorId: string, amount: number, tier: string): InternalCreditPayload {
  return {
    amount,
    description: `Compensation for failed subscription credit: ${subscriptionIdempotencyKey(userId, creatorId, tier)}`,
    idempotencyKey: `compensate:${subscriptionIdempotencyKey(userId, creatorId, tier)}`,
  };
}
