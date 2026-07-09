import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import * as path from 'path';

const { integer, string, regex } = MatchersV3;

const provider = new PactV4({
  consumer: 'MobileApp',
  provider: 'PaymentService',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Payment API Contract', () => {
  describe('POST /v1/payments/initialize', () => {
    it('initializes a payment', async () => {
      await provider
        .addInteraction()
        .given('user has a wallet')
        .uponReceiving('a payment initialization request')
        .withRequest('POST', '/v1/payments/initialize', (builder) => {
          builder.headers({
            Authorization: 'Bearer some-jwt-token',
            'Content-Type': 'application/json',
          });
          builder.jsonBody({
            amount: 5000,
            currency: 'NGN',
            description: 'Content purchase',
            contentId: 'test-content-id',
          });
        })
        .willRespondWith(201, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              id: string('payment-id-123'),
              amount: integer(5000),
              currency: regex('NGN|USD', 'NGN'),
              status: regex('pending|initialized', 'pending'),
              reference: string('pay_ref_123'),
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/v1/payments/initialize`, {
            method: 'POST',
            headers: {
              Authorization: 'Bearer some-jwt-token',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: 5000,
              currency: 'NGN',
              description: 'Content purchase',
              contentId: 'test-content-id',
            }),
          });

          expect(response.status).toBe(201);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('id');
          expect(body.data).toHaveProperty('amount');
          expect(body.data).toHaveProperty('currency');
          expect(body.data).toHaveProperty('status');
          expect(body.data).toHaveProperty('reference');
        });
    });
  });

  describe('GET /v1/payments/:id', () => {
    it('returns payment status', async () => {
      await provider
        .addInteraction()
        .given('a payment exists')
        .uponReceiving('a request to get payment status')
        .withRequest('GET', '/v1/payments/payment-id-123', (builder) => {
          builder.headers({
            Authorization: 'Bearer some-jwt-token',
          });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              id: string('payment-id-123'),
              amount: integer(5000),
              currency: regex('NGN|USD', 'NGN'),
              status: regex('pending|completed|failed', 'completed'),
              reference: string('pay_ref_123'),
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/v1/payments/payment-id-123`,
            {
              headers: {
                Authorization: 'Bearer some-jwt-token',
              },
            }
          );

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('id');
          expect(body.data).toHaveProperty('status');
        });
    });
  });
});
