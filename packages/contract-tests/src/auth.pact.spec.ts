import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import * as path from 'path';

const { integer, string, regex } = MatchersV3;
const TEST_PASSWORD = 'ValidPassword123!';

const provider = new PactV4({
  consumer: 'MobileApp',
  provider: 'AuthService',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Auth API Contract', () => {
  describe('POST /v1/auth/login', () => {
    it('returns auth tokens on successful login', async () => {
      await provider
        .addInteraction()
        .given('valid credentials')
        .uponReceiving('a login request')
        .withRequest('POST', '/v1/auth/login', (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            email: 'test@example.com',
            password: TEST_PASSWORD,
          });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              accessToken: string('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
              refreshToken: string('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
              user: {
                id: string('550e8400-e29b-41d4-a716-446655440000'),
                email: string('test@example.com'),
                displayName: string('Test User'),
                role: regex('user|admin|creator', 'user'),
              },
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: TEST_PASSWORD,
            }),
          });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('accessToken');
          expect(body.data).toHaveProperty('refreshToken');
          expect(body.data.user).toHaveProperty('id');
          expect(body.data.user).toHaveProperty('email');
          expect(body.data.user).toHaveProperty('role');
        });
    });
  });

  describe('GET /v1/auth/validate', () => {
    it('validates a valid token', async () => {
      await provider
        .addInteraction()
        .given('a valid token exists')
        .uponReceiving('a token validation request')
        .withRequest('GET', '/v1/auth/validate', (builder) => {
          builder.headers({
            Authorization: 'Bearer some-jwt-token',
          });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              valid: true,
              userId: string('550e8400-e29b-41d4-a716-446655440000'),
              role: regex('user|admin|creator', 'user'),
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/v1/auth/validate`, {
            headers: { Authorization: 'Bearer some-jwt-token' },
          });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data.valid).toBe(true);
          expect(body.data).toHaveProperty('userId');
          expect(body.data).toHaveProperty('role');
        });
    });
  });
});
