import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import * as path from 'path';

const { integer, regex } = MatchersV3;

const provider = new PactV4({
  consumer: 'MobileApp',
  provider: 'WalletService',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Wallet API Contract', () => {
  describe('GET /v1/wallet/balance', () => {
    it('returns a wallet balance', async () => {
      await provider
        .addInteraction()
        .given('a wallet exists for the user')
        .uponReceiving('a request to get wallet balance')
        .withRequest('GET', '/v1/wallet/balance', (builder) => {
          builder.headers({
            Authorization: 'Bearer some-jwt-token',
            'Content-Type': 'application/json',
          });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              balance: integer(5000),
              currency: regex('NGN|USD', 'NGN'),
              bonusBalance: integer(500),
              promoBalance: integer(0),
              totalBalance: integer(5500),
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/v1/wallet/balance`, {
            method: 'GET',
            headers: {
              Authorization: 'Bearer some-jwt-token',
              'Content-Type': 'application/json',
            },
          });

          expect(response.status).toBe(200);

          const body = await response.json();

          // Assert the response matches the expected shape
          expect(body).toEqual({
            success: true,
            data: {
              balance: expect.any(Number),
              currency: expect.stringMatching(/^(NGN|USD)$/),
              bonusBalance: expect.any(Number),
              promoBalance: expect.any(Number),
              totalBalance: expect.any(Number),
            },
          });
        });
    });
  });
});
