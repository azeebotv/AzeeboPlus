import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse, AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ApiVersioningService } from './api-versioning.service';
import { Request, Response } from 'express';

describe('Proxy Controller - Upstream Behavior Preservation', () => {
  let controller: ProxyController;
  let httpService: HttpService;

  const mockResponse = {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-123',
      'x-trace-id': 'trace-456',
    },
    data: { success: true },
  } as AxiosResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        ProxyService,
        ApiVersioningService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            patch: jest.fn(),
            delete: jest.fn(),
            request: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('Status Code Preservation', () => {
    it('should preserve 200 OK status from upstream', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: mockResponse.headers,
        data: { data: 'test' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: { 'x-request-id': 'test-123' },
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(200);
    });

    it('should preserve 201 Created status from upstream', async () => {
      const upstreamResponse = {
        status: 201,
        statusText: 'Created',
        headers: mockResponse.headers,
        data: { id: 'new-resource' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'POST',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'POST', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(201);
    });

    it('should preserve 204 No Content status from upstream', async () => {
      const upstreamResponse = {
        status: 204,
        statusText: 'No Content',
        headers: {},
        data: null,
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'DELETE',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'DELETE', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(204);
    });

    it('should preserve 400 Bad Request status from upstream', async () => {
      const upstreamResponse = {
        status: 400,
        statusText: 'Bad Request',
        headers: mockResponse.headers,
        data: { error: 'Invalid input' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'POST',
        query: {},
        params: {},
        body: { invalid: true },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'POST', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(400);
    });

    it('should preserve 401 Unauthorized status from upstream', async () => {
      const upstreamResponse = {
        status: 401,
        statusText: 'Unauthorized',
        headers: mockResponse.headers,
        data: { error: 'Invalid token' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: { authorization: 'Bearer invalid' },
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(401);
    });

    it('should preserve 404 Not Found status from upstream', async () => {
      const upstreamResponse = {
        status: 404,
        statusText: 'Not Found',
        headers: mockResponse.headers,
        data: { error: 'Resource not found' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/nonexistent',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(
        mockRequest,
        mockResponseObj,
        'users',
        '/nonexistent',
        'GET',
        {}
      );

      expect(mockResponseObj.status).toHaveBeenCalledWith(404);
    });

    it('should preserve 500 Internal Server Error status from upstream', async () => {
      const upstreamResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: mockResponse.headers,
        data: { error: 'Internal error' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Header Preservation', () => {
    it('should preserve X-Request-ID header from upstream', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'x-request-id': 'upstream-req-123',
          'content-type': 'application/json',
        },
        data: { success: true },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('X-Request-ID', 'upstream-req-123');
    });

    it('should preserve X-Trace-ID header from upstream', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'x-trace-id': 'upstream-trace-456',
          'content-type': 'application/json',
        },
        data: { success: true },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('X-Trace-ID', 'upstream-trace-456');
    });

    it('should preserve Authorization header from upstream', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          authorization: 'Bearer new-token-xyz',
          'content-type': 'application/json',
        },
        data: { token: 'new-token-xyz' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith(
        'Authorization',
        'Bearer new-token-xyz'
      );
    });

    it('should preserve Content-Type header from upstream', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        data: { success: true },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json; charset=utf-8'
      );
    });

    it('should preserve custom upstream headers', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'x-custom-header': 'custom-value',
          'x-rate-limit': '100',
          'x-ratelimit-remaining': '99',
          'content-type': 'application/json',
        },
        data: { success: true },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('X-Custom-Header', 'custom-value');
      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('X-Rate-Limit', '100');
      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('X-Ratelimit-Remaining', '99');
    });
  });

  describe('Non-JSON Response Handling', () => {
    it('should handle text/plain responses', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'text/plain',
        },
        data: 'Plain text response',
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        send: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(mockResponseObj.send).toHaveBeenCalledWith('Plain text response');
    });

    it('should handle application/xml responses', async () => {
      const upstreamResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/xml',
        },
        data: '<xml>response</xml>',
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        send: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.setHeader).toHaveBeenCalledWith('Content-Type', 'application/xml');
      expect(mockResponseObj.send).toHaveBeenCalledWith('<xml>response</xml>');
    });
  });

  describe('Timeout Handling', () => {
    it('should handle request timeout correctly', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
        isAxiosError: true,
        name: 'TimeoutError',
      } as AxiosError;

      jest.spyOn(httpService, 'request').mockReturnValue(throwError(() => timeoutError));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(504);
    });
  });

  describe('Error Response Handling', () => {
    it('should preserve 502 Bad Gateway status from upstream', async () => {
      const upstreamResponse = {
        status: 502,
        statusText: 'Bad Gateway',
        headers: mockResponse.headers,
        data: { error: 'Upstream server error' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(502);
    });

    it('should preserve 503 Service Unavailable status from upstream', async () => {
      const upstreamResponse = {
        status: 503,
        statusText: 'Service Unavailable',
        headers: mockResponse.headers,
        data: { error: 'Service temporarily unavailable' },
      } as AxiosResponse;

      jest.spyOn(httpService, 'request').mockReturnValue(of(upstreamResponse));

      const mockRequest = {
        headers: {},
        path: '/test',
        method: 'GET',
        query: {},
        params: {},
        body: {},
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const mockResponseObj = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.proxyRequest(mockRequest, mockResponseObj, 'auth', '/test', 'GET', {});

      expect(mockResponseObj.status).toHaveBeenCalledWith(503);
    });
  });
});
