import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { FundWalletDto } from './fund-wallet.dto.js';
import { WithdrawWalletDto, resolveWithdrawalDestination } from './withdraw-transfer.dto.js';

/**
 * Pinned against the payloads in this repo, because every wallet service runs
 * `whitelist: true, forbidNonWhitelisted: true`: an undeclared field is a 400,
 * and before this the app could not fund or withdraw at all.
 */
const PIPE = { whitelist: true, forbidNonWhitelisted: true };

const fields = (errors: { property: string }[]): string[] => errors.map((e) => e.property).sort();

describe('wallet request DTOs', () => {
  describe('FundWalletDto', () => {
    it('accepts the mobile/TV payload (provider + email)', async () => {
      const dto = plainToInstance(FundWalletDto, {
        amount: 1000,
        provider: 'paystack',
        email: 'a@b.com',
      });

      expect(await validate(dto, PIPE)).toEqual([]);
    });

    it('accepts the web payload (paymentMethod)', async () => {
      const dto = plainToInstance(FundWalletDto, { amount: 1000, paymentMethod: 'card' });
      expect(await validate(dto, PIPE)).toEqual([]);
    });

    it('still rejects a non-positive amount', async () => {
      const dto = plainToInstance(FundWalletDto, { amount: 0 });
      expect(fields(await validate(dto, PIPE))).toEqual(['amount']);
    });
  });

  describe('WithdrawWalletDto', () => {
    it('accepts the mobile payload (bankCode + accountNumber)', async () => {
      const dto = plainToInstance(WithdrawWalletDto, {
        idempotencyKey: 'key-1',
        amount: 500,
        bankCode: '058',
        accountNumber: '0123456789',
      });

      expect(await validate(dto, PIPE)).toEqual([]);
      expect(resolveWithdrawalDestination(dto)).toEqual({
        bankCode: '058',
        accountNumber: '0123456789',
      });
    });

    it('accepts the web payload (nested bankDetails)', async () => {
      const dto = plainToInstance(WithdrawWalletDto, {
        idempotencyKey: 'key-2',
        amount: 500,
        bankDetails: {
          bankName: 'GTBank',
          bankCode: '058',
          accountNumber: '0123456789',
          accountName: 'Jane Doe',
        },
      });

      expect(await validate(dto, PIPE)).toEqual([]);
      expect(resolveWithdrawalDestination(dto)).toEqual({
        bankCode: '058',
        accountNumber: '0123456789',
        bankName: 'GTBank',
        accountName: 'Jane Doe',
      });
    });

    it('accepts a linked bank-account id', async () => {
      const dto = plainToInstance(WithdrawWalletDto, {
        idempotencyKey: 'key-3',
        amount: 500,
        bankAccountId: 'bank-1',
      });

      expect(await validate(dto, PIPE)).toEqual([]);
      expect(resolveWithdrawalDestination(dto)).toEqual({ bankAccountId: 'bank-1' });
    });

    it('names no destination at all when the caller omits every shape', () => {
      // The service turns this into a 400 with a message a client can act on,
      // rather than the pipe rejecting a shape it did not know.
      expect(resolveWithdrawalDestination({})).toBeNull();
      expect(resolveWithdrawalDestination({ bankDetails: {} })).toBeNull();
    });

    it('keeps the idempotency key mandatory (AUD-03)', async () => {
      const dto = plainToInstance(WithdrawWalletDto, {
        amount: 500,
        accountNumber: '0123456789',
      });

      expect(fields(await validate(dto, PIPE))).toEqual(['idempotencyKey']);
    });
  });
});
