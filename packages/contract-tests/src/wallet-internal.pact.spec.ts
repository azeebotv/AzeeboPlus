/**
 * Wallet internal-surface contract tests — creator-service → wallet-service.
 *
 * Proves that every payload creator-service actually sends to wallet-service's
 * internal wallet endpoints satisfies wallet-service's internal DTOs, so the
 * two services' request shapes cannot silently diverge again. (The historical
 * divergence this guards: creator-service sent { amount, description,
 * idempotencyKey } while the debit endpoint's DTO still required `walletId`
 * — with the global forbidNonWhitelisted ValidationPipe, every tip would
 * have been rejected 400.)
 *
 * What makes these contracts hard to drift:
 *   • The payloads come from creator-service's REAL builders
 *     (wallet-payloads.ts) — the same functions the payment methods call.
 *   • They are validated against the internal DTO classes, and via the
 *     PRODUCTION ValidationPipe configuration (whitelist + transform +
 *     forbidNonWhitelisted) — the exact pipeline that accepts or rejects
 *     requests in the running wallet-service.
 *   • The DTO mirror (wallet-contract/internal-wallet.dtos.ts, maintained in
 *     creator-service with provenance documentation) must track
 *     wallet-service's actual DTO file; updating one without the other
 *     surfaces here.
 *
 * Endpoint/auth contract (proven live e2e against a booted wallet-service):
 *   POST /v1/internal/wallets/user/:userId/debit  ← InternalDebitWalletDto
 *   POST /v1/internal/wallets/user/:userId/credit ← InternalCreditWalletDto
 *   auth header: x-internal-api-key (GATEWAY_SECRET, falling back to
 *   INTERNAL_API_KEY — same resolution order in InternalSecretGuard and the
 *   creator-service caller).
 *
 * Run: pnpm --filter @azeebo/contract-tests test:contracts
 */

import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { Validator } from 'class-validator';
import { InternalDebitWalletDto, InternalCreditWalletDto } from '../../../services/universes/creator-service/src/modules/creators/wallet-contract/internal-wallet.dtos.js';
import {
  tipDebitPayload,
  tipCreditPayload,
  tipCompensationPayload,
  subscriptionDebitPayload,
  subscriptionCreditPayload,
  subscriptionCompensationPayload,
} from '../../../services/universes/creator-service/src/modules/creators/wallet-payloads.js';

/** The production pipe config from wallet-service's main.ts. */
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

/** Transform a raw body exactly as the running wallet-service would. */
const transform = (payload: unknown, metatype: any): Promise<unknown> =>
  pipe.transform(payload, { type: 'body', metatype, data: '' });

const validator = new Validator();

describe('wallet internal-surface contract (creator-service payloads → wallet-service DTOs)', () => {
  describe('tip flow', () => {
    it('tipDebitPayload satisfies InternalDebitWalletDto end-to-end', async () => {
      const payload = tipDebitPayload('user-1', 'creator-1', 150.25);
      const transformed = (await transform(payload, InternalDebitWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 150.25,
        description: 'Tip to creator creator-1',
        idempotencyKey: 'tip:user-1:creator-1:150.25',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });

    it('tipCreditPayload satisfies InternalCreditWalletDto end-to-end', async () => {
      const payload = tipCreditPayload('user-1', 'creator-1', 150.25);
      const transformed = (await transform(payload, InternalCreditWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 150.25,
        description: 'Tip from user user-1',
        idempotencyKey: 'tip:user-1:creator-1:150.25:credit',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });

    it('tipCompensationPayload satisfies InternalCreditWalletDto end-to-end', async () => {
      const payload = tipCompensationPayload('user-1', 'creator-1', 150.25);
      const transformed = (await transform(payload, InternalCreditWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 150.25,
        description: 'Compensation for failed tip credit: tip:user-1:creator-1:150.25',
        idempotencyKey: 'compensate:tip:user-1:creator-1:150.25',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });
  });

  describe('premium subscription flow', () => {
    it('subscriptionDebitPayload satisfies InternalDebitWalletDto end-to-end', async () => {
      const payload = subscriptionDebitPayload('user-1', 'creator-1', 500, 'gold');
      const transformed = (await transform(payload, InternalDebitWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 500,
        description: 'Subscription to creator creator-1 - gold',
        idempotencyKey: 'subscribe:user-1:creator-1:gold',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });

    it('subscriptionCreditPayload satisfies InternalCreditWalletDto end-to-end', async () => {
      const payload = subscriptionCreditPayload('user-1', 'creator-1', 500, 'gold');
      const transformed = (await transform(payload, InternalCreditWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 500,
        description: 'Subscription from user user-1 - gold',
        idempotencyKey: 'subscribe:user-1:creator-1:gold:credit',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });

    it('subscriptionCompensationPayload satisfies InternalCreditWalletDto end-to-end', async () => {
      const payload = subscriptionCompensationPayload('user-1', 'creator-1', 500, 'gold');
      const transformed = (await transform(payload, InternalCreditWalletDto)) as Record<string, unknown>;
      expect(transformed).toMatchObject({
        amount: 500,
        description: 'Compensation for failed subscription credit: subscribe:user-1:creator-1:gold',
        idempotencyKey: 'compensate:subscribe:user-1:creator-1:gold',
      });
      expect(await validator.validate(transformed)).toEqual([]);
    });
  });

  describe('the divergence class this suite exists to catch', () => {
    it('a payload carrying a field the DTO does not declare is rejected (the walletId regression)', async () => {
      const err = await transform(
        { amount: 10, description: 'x', walletId: 'legacy-wallet-id' },
        InternalDebitWalletDto,
      ).then(
        () => null,
        (e) => e,
      );
      expect(err).toBeInstanceOf(BadRequestException);
      // Nest's ValidationPipe puts the constraint details in getResponse(),
      // not the Error message.
      const response = (err as BadRequestException).getResponse() as { message: string | string[] };
      const messages = Array.isArray(response.message) ? response.message : [response.message];
      expect(messages.join(' ')).toMatch(/walletId should not exist/);
    });

    it('an amount below the DTO minimum is rejected', async () => {
      await expect(transform(tipDebitPayload('u', 'c', 0), InternalDebitWalletDto)).rejects.toThrow();
      await expect(transform(tipCreditPayload('u', 'c', -5), InternalCreditWalletDto)).rejects.toThrow();
    });

    it('a string amount is rejected (DTOs declare @IsNumber, no implicit conversion)', async () => {
      await expect(
        transform({ amount: '10', description: 'x' }, InternalDebitWalletDto)
      ).rejects.toThrow();
    });

    it('a missing required description is rejected', async () => {
      await expect(transform({ amount: 10 }, InternalDebitWalletDto)).rejects.toThrow();
    });
  });

  describe('structural no-drift checks', () => {
    const DEBIT_KEYS = ['amount', 'description', 'reference', 'idempotencyKey'];
    const CREDIT_KEYS = ['amount', 'description', 'idempotencyKey'];

    it('builders return ONLY keys the internal DTOs declare', () => {
      const debitPayloads = [
        tipDebitPayload('u', 'c', 5),
        subscriptionDebitPayload('u', 'c', 5, 'gold'),
      ];
      const creditPayloads = [
        tipCreditPayload('u', 'c', 5),
        tipCompensationPayload('u', 'c', 5),
        subscriptionCreditPayload('u', 'c', 5, 'gold'),
        subscriptionCompensationPayload('u', 'c', 5, 'gold'),
      ];
      for (const p of debitPayloads) {
        expect(Object.keys(p).filter((k) => !DEBIT_KEYS.includes(k))).toEqual([]);
      }
      for (const p of creditPayloads) {
        expect(Object.keys(p).filter((k) => !CREDIT_KEYS.includes(k))).toEqual([]);
      }
    });

    it('idempotency keys follow the agreed namespacing', () => {
      expect(tipDebitPayload('u', 'c', 5).idempotencyKey).toBe('tip:u:c:5');
      expect(tipCreditPayload('u', 'c', 5).idempotencyKey).toBe('tip:u:c:5:credit');
      expect(tipCompensationPayload('u', 'c', 5).idempotencyKey).toBe('compensate:tip:u:c:5');
      expect(subscriptionDebitPayload('u', 'c', 5, 'gold').idempotencyKey).toBe('subscribe:u:c:gold');
      expect(subscriptionCreditPayload('u', 'c', 5, 'gold').idempotencyKey).toBe('subscribe:u:c:gold:credit');
      expect(subscriptionCompensationPayload('u', 'c', 5, 'gold').idempotencyKey).toBe('compensate:subscribe:u:c:gold');
    });
  });
});
