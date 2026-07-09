import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import * as path from 'path';

const { integer, string, regex } = MatchersV3;

const provider = new PactV4({
  consumer: 'MobileApp',
  provider: 'ContentService',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('Content API Contract', () => {
  describe('GET /v1/content/:id', () => {
    it('returns content details', async () => {
      await provider
        .addInteraction()
        .given('content exists')
        .uponReceiving('a request to get content details')
        .withRequest('GET', '/v1/content/test-content-id', (builder) => {
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
              id: string('test-content-id'),
              title: string('Test Content'),
              description: string('A test content item'),
              status: regex('published|draft|archived', 'published'),
              universeId: string('550e8400-e29b-41d4-a716-446655440000'),
              creatorId: string('550e8400-e29b-41d4-a716-446655440000'),
              viewCount: integer(100),
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/v1/content/test-content-id`, {
            headers: {
              Authorization: 'Bearer some-jwt-token',
              'Content-Type': 'application/json',
            },
          });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('id');
          expect(body.data).toHaveProperty('title');
          expect(body.data).toHaveProperty('status');
          expect(body.data).toHaveProperty('universeId');
          expect(body.data).toHaveProperty('creatorId');
          expect(body.data).toHaveProperty('viewCount');
        });
    });
  });

  describe('GET /v1/content', () => {
    it('returns paginated content list', async () => {
      await provider
        .addInteraction()
        .given('content exists')
        .uponReceiving('a request to list content')
        .withRequest('GET', '/v1/content', (builder) => {
          builder.headers({
            Authorization: 'Bearer some-jwt-token',
          });
          builder.query({ page: '1', limit: '10' });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ 'Content-Type': 'application/json' });
          builder.jsonBody({
            success: true,
            data: {
              items: [],
              total: integer(0),
              page: integer(1),
              limit: integer(10),
              hasMore: false,
            },
          });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/v1/content?page=1&limit=10`,
            {
              headers: {
                Authorization: 'Bearer some-jwt-token',
              },
            }
          );

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('items');
          expect(body.data).toHaveProperty('total');
          expect(body.data).toHaveProperty('page');
          expect(body.data).toHaveProperty('hasMore');
        });
    });
  });
});
