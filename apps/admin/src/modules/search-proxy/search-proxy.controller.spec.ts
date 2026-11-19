import { SearchProxyController } from './search-proxy.controller';
import { Request, Response } from 'express';

describe('SearchProxyController', () => {
  let controller: SearchProxyController;

  beforeEach(() => {
    controller = new SearchProxyController();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should fallback to 200 with degraded fuzzy status if search-service is offline for /admin/stats', async () => {
    const mockReq = {
      path: '/api/v1/search/admin/stats',
      method: 'GET',
      headers: {},
      query: {},
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;

    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (body: unknown) => {
        responseBody = body;
        return mockRes;
      },
      send: (body: unknown) => {
        responseBody = body;
        return mockRes;
      },
      setHeader: jest.fn(),
    } as unknown as Response;

    // Simulate network error / fetch failure
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    try {
      await controller.proxyAll(mockReq, mockRes);
      expect(statusCode).toBe(200);
      expect(responseBody).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            fuzzy: expect.objectContaining({
              degraded: true,
              mode: 'exact',
            }),
          }),
        })
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should return 502 for non-stats paths if upstream search fails', async () => {
    const mockReq = {
      path: '/api/v1/search/queries',
      method: 'GET',
      headers: {},
      query: {},
    } as unknown as Request;

    let statusCode: number | undefined;
    let responseBody: unknown;

    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (body: unknown) => {
        responseBody = body;
        return mockRes;
      },
      setHeader: jest.fn(),
    } as unknown as Response;

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    try {
      await controller.proxyAll(mockReq, mockRes);
      expect(statusCode).toBe(502);
      expect(responseBody).toEqual(
        expect.objectContaining({
          success: false,
          error: 'Search service unavailable',
        })
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
