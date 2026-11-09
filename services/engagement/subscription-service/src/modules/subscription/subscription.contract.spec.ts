import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto';
import { SubscribeBundleDto } from '../bundle/dto/subscribe-bundle.dto';

// Mirrors the ValidationPipe options in src/main.ts so the contract matches
// what the running service actually accepts.
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });

const validate = (metatype: new () => object, body: unknown) =>
  pipe.transform(body, { type: 'body', metatype });

// Bodies sent by packages/react-data/src/api/subscription.ts and bundle.ts.
describe('Subscription API contract (client request bodies)', () => {
  it('accepts the body sent by subscribe(dto)', async () => {
    await expect(
      validate(SubscribeToPlanDto, {
        planId: 'plan-1',
        autoRenew: true,
        paymentMethod: 'wallet',
        paymentReference: 'pay_ref_abc123',
      })
    ).resolves.toBeDefined();
  });

  it('rejects an unknown paymentMethod in subscribe(dto)', async () => {
    await expect(
      validate(SubscribeToPlanDto, { planId: 'plan-1', paymentMethod: 'card' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts the body sent by bundleApi.subscribe', async () => {
    await expect(
      validate(SubscribeBundleDto, {
        autoRenew: false,
        paymentMethod: 'external',
        paymentReference: 'pay_ref_xyz',
      })
    ).resolves.toBeDefined();
  });

  it('rejects an unexpected field in the bundle subscribe body', async () => {
    await expect(
      validate(SubscribeBundleDto, { autoRenew: true, planId: 'plan-1' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
