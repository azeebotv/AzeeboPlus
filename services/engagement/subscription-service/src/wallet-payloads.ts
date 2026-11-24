/**
 * Wallet request builders for the wallet-service internal surface.
 *
 * These are the ONLY places in subscription-service that construct URLs and
 * bodies for wallet-service's internal wallet endpoints — both payment
 * modules (subscription + bundle) consume them, so a wire-shape change is
 * intentional and visible in one file. The contract spec validates the
 * payload builders against wallet-service's real DTO classes
 * (see wallet-contract/internal-wallet.dtos.ts).
 *
 * Endpoints (auth: x-internal-api-key from GATEWAY_SECRET ?? INTERNAL_API_KEY):
 *   GET  /v1/internal/wallets/user/:userId       (lookup; auto-creates, enveloped response)
 *   POST /v1/internal/wallets/user/:userId/debit InternalDebitWalletDto
 *
 * Wire-true: the payload contains ONLY fields the internal DTO declares, so
 * it can be sent as-is (forbidNonWhitelisted rejects anything else).
 */

import type { InternalDebitWalletDto } from './wallet-contract/internal-wallet.dtos.js';

export type InternalDebitPayload = Omit<InternalDebitWalletDto, never>;

/** Internal lookup URL for a user's wallet (GET, enveloped response). */
export function walletLookupUrl(baseUrl: string, userId: string): string {
  return `${baseUrl}/v1/internal/wallets/user/${userId}`;
}

/** Internal debit URL for a user's wallet (POST). */
export function walletDebitUrl(baseUrl: string, userId: string): string {
  return `${baseUrl}/v1/internal/wallets/user/${userId}/debit`;
}

/**
 * Debit a user's wallet on the internal surface (wallet resolved from the
 * URL path — no walletId in the body, which forbidNonWhitelisted would
 * reject).
 */
export function walletDebitPayload(
  amount: number,
  description: string,
  idempotencyKey: string
): InternalDebitPayload {
  return {
    amount,
    description,
    idempotencyKey,
  };
}

/**
 * Headers for internal wallet-service calls. The routes carry no user
 * identity — the shared secret authenticates the service itself
 * (wallet-service InternalSecretGuard, which resolves GATEWAY_SECRET with
 * INTERNAL_API_KEY as fallback; same order here).
 */
export function walletInternalHeaders(internalApiKey: string): Record<string, string> {
  return { 'x-internal-api-key': internalApiKey };
}
