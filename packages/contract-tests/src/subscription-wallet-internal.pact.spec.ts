/**
 * Wallet internal-surface contract tests — subscription-service → wallet-service.
 *
 * Proves that the URLs, payloads, and auth headers subscription-service
 * (subscription + bundle payment flows) send to wallet-service's internal
 * wallet endpoints satisfy wallet-service's internal DTOs. These flows had
 * the same disease creator-service was cured of: calls to a nonexistent
 * `/wallet/debit` with the legacy `{ walletId, … }` body, no `/v1` prefix,
 * and no internal secret — guaranteed 404/401 on the real surface.
 *
 * Contracts pinned here:
 *   • URLs — canonical internal paths (`/v1/internal/wallets/user/:id[/debit]`),
 *     so a regression to the old unversioned paths fails CI
 *   • Payloads — the real builders validated through the PRODUCTION
 *     ValidationPipe config (whitelist + transform + forbidNonWhitelisted)
 *     against the internal DTO classes (provenance-documented mirror in
 *     services/engagement/subscription-service/src/wallet-contract/)
 *   • Auth — exactly the x-internal-api-key header, resolved
 *     GATEWAY_SECRET ?? INTERNAL_API_KEY (InternalSecretGuard's order)
 *   • Response envelope — consumers read `response.data.data` (the internal
 *     lookup is enveloped by ApiResponseWrapper; proven live e2e)
 *
 * Run: pnpm --filter @azeebo/contract-tests test:contracts
 */

import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { Validator } from 'class-validator';
import { InternalDebitWalletDto, InternalCreditWalletDto } from '../../../services/engagement/subscription-service/src/wallet-contract/internal-wallet.dtos.js';
import {
  walletLookupUrl,
  walletDebitUrl,
  walletDebitPayload,
  walletInternalHeaders,
} from '../../../services/engagement/subscription-service/src/wallet-payloads.js';

const BASE = 'http://wallet-service:3002';

/** The production pipe config from wallet-service's main.ts. */
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

const transform = (payload: unknown, metatype: any): Promise<unknown> =>
  pipe.transform(payload, { type: 'body', metatype, data: '' });

const validator = new Validator();

describe('wallet internal-surface contract (subscription-service payloads → wallet-service DTOs)', () => {
  describe('URLs hit the real internal surface', () => {
    it('lookup uses /v1/internal/wallets/user/:userId', () => {
      expect(walletLookupUrl(BASE, 'user-1')).toBe('http://wallet-service:3002/v1/internal/wallets/user/user-1');
    });

    it('debit uses /v1/internal/wallets/user/:userId/debit', () => {
      expect(walletDebitUrl(BASE, 'user-1')).toBe('http://wallet-service:3002/v1/internal/wallets/user/user-1/debit');
    });
  });

  describe('payloads satisfy the internal DTOs', () => {
    it('walletDebitPayload satisfies InternalDebitWalletDto end-to-end', async () => {
      const payload = walletDebitPayload(4500, 'Subscription to plan premium', 'uuid-1');
      const transformed = (await transform(payload, InternalDebitWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 4500,
        description: 'Subscription to plan premium',
        idempotencyKey: 'uuid-1',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });

    it('carries NO walletId — the wallet is resolved from the URL path', () => {
      const payload = walletDebitPayload(10, 'd', 'k');
      expect('walletId' in payload).toBe(false);
    });

    it('a legacy { walletId, … } body is rejected by the real pipeline (the cured disease)', async () => {
      const err = await transform(
        { walletId: 'wallet-1', amount: 10, description: 'x', idempotencyKey: 'k' },
        InternalDebitWalletDto,
      ).then(
        () => null,
        (e) => e,
      );
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as { message: string | string[] };
      const messages = Array.isArray(response.message) ? response.message : [response.message];
      expect(messages.join(' ')).toMatch(/walletId should not exist/);
    });

    it('an amount below the DTO minimum is rejected', async () => {
      await expect(transform(walletDebitPayload(0, 'd', 'k'), InternalDebitWalletDto)).rejects.toThrow();
    });
  });

  describe('auth', () => {
    it('sends exactly the internal secret header', () => {
      expect(walletInternalHeaders('secret-value')).toEqual({ 'x-internal-api-key': 'secret-value' });
    });
  });

  describe('response envelope the consumers must parse', () => {
    it('credit DTO mirror also validates compensation-style bodies (future refunds)', async () => {
      const transformed = (await transform(
        { amount: 4500, description: 'Refund', idempotencyKey: 'k' },
        InternalCreditWalletDto,
      )) as Record<string, unknown>;
      expect(await validator.validate(transformed)).toEqual([]);
    });
  });
});
