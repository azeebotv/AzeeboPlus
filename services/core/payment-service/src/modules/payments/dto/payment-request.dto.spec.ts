import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { InitializePaymentDto } from './initialize-payment.dto.js';
import { VerifyPaymentDto } from './verify-payment.dto.js';

/**
 * Request shapes are pinned against what the repo's own clients and controller
 * examples send. `whitelist` + `forbidNonWhitelisted` (the pipe every payment
 * service runs) turns any undeclared field into a 400, so a field that is not
 * declared here is a field the shipped checkout cannot send.
 */
const PIPE = { whitelist: true, forbidNonWhitelisted: true };

const fields = (errors: { property: string }[]): string[] => errors.map((e) => e.property).sort();

describe('payment request DTOs', () => {
  describe('InitializePaymentDto', () => {
    it('accepts the payload react-data paymentApi.initialize sends', async () => {
      const dto = plainToInstance(InitializePaymentDto, {
        amount: 1000,
        currency: 'NGN',
        email: 'a@b.com',
        metadata: { walletId: 'wallet-1' },
      });

      expect(await validate(dto, PIPE)).toEqual([]);
    });

    it('accepts the controller’s own documented example (paymentMethod)', async () => {
      const dto = plainToInstance(InitializePaymentDto, {
        amount: 1000,
        currency: 'NGN',
        paymentMethod: 'card',
        description: 'Wallet funding',
        metadata: { walletId: 'wallet-1' },
      });

      expect(await validate(dto, PIPE)).toEqual([]);
    });

    it('still rejects a payment with no amount', async () => {
      const dto = plainToInstance(InitializePaymentDto, { currency: 'NGN' });
      expect(fields(await validate(dto, PIPE))).toEqual(['amount']);
    });
  });

  describe('VerifyPaymentDto', () => {
    it('accepts the provider reference checkout returns', async () => {
      const dto = plainToInstance(VerifyPaymentDto, { reference: 'ref_123' });
      expect(await validate(dto, PIPE)).toEqual([]);
    });

    it('accepts the intent id from /initialize', async () => {
      const dto = plainToInstance(VerifyPaymentDto, { transactionId: 'pay-123' });
      expect(await validate(dto, PIPE)).toEqual([]);
    });

    it('still rejects a verification that names no payment', async () => {
      const dto = plainToInstance(VerifyPaymentDto, {});
      expect(fields(await validate(dto, PIPE))).toEqual(['transactionId']);
    });

    it('rejects an empty reference (and the then-missing intent id)', async () => {
      const dto = plainToInstance(VerifyPaymentDto, { reference: '' });
      // An empty reference is not a usable handle, so `transactionId` is
      // required again — both are reported, which is the honest answer.
      expect(fields(await validate(dto, PIPE))).toEqual(['reference', 'transactionId']);
    });
  });
});
