import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CircuitBreakerOpenError } from '@azeebo/shared-types';

import { mapAndThrow, mapErrorToHttpException } from './error-mapping';

/** Build an axios-shaped error without depending on axios. */
function axiosError(status: number, data: unknown, code?: string): Error {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
    response?: { status: number; data: unknown };
    code?: string;
  };
  err.response = { status, data };
  if (code) err.code = code;
  return err;
}

describe('mapErrorToHttpException', () => {
  it('rethrows HttpException instances unchanged', () => {
    const original = new NotFoundException('User not found');
    const mapped = mapErrorToHttpException(original);
    expect(mapped).toBe(original);
    expect(mapped.getStatus()).toBe(404);
  });

  it('maps CircuitBreakerOpenError to 503', () => {
    const mapped = mapErrorToHttpException(new CircuitBreakerOpenError('wallet breaker open'));
    expect(mapped).toBeInstanceOf(ServiceUnavailableException);
    expect(mapped.getStatus()).toBe(503);
  });

  it('maps upstream 400 to BadRequestException preserving the upstream message', () => {
    const mapped = mapErrorToHttpException(
      axiosError(400, { message: 'Insufficient wallet balance' })
    );
    expect(mapped).toBeInstanceOf(BadRequestException);
    expect(mapped.getStatus()).toBe(400);
    expect(mapped.message).toContain('Insufficient wallet balance');
  });

  it('maps upstream 401/403/404/409/422 to the matching 4xx exception', () => {
    expect(mapErrorToHttpException(axiosError(401, {}))).toBeInstanceOf(UnauthorizedException);
    expect(mapErrorToHttpException(axiosError(403, {}))).toBeInstanceOf(ForbiddenException);
    expect(mapErrorToHttpException(axiosError(404, {}))).toBeInstanceOf(NotFoundException);
    expect(mapErrorToHttpException(axiosError(409, {}))).toBeInstanceOf(ConflictException);
    expect(mapErrorToHttpException(axiosError(422, {}))).toBeInstanceOf(
      UnprocessableEntityException
    );
  });

  it('maps upstream 5xx to 502 BadGateway (not a client error)', () => {
    const mapped = mapErrorToHttpException(axiosError(500, { message: 'DB exploded' }));
    expect(mapped).toBeInstanceOf(BadGatewayException);
    expect(mapped.getStatus()).toBe(502);
    expect(mapped.message).toContain('DB exploded');
  });

  it('maps unhandled upstream statuses to 502', () => {
    const mapped = mapErrorToHttpException(axiosError(418, {}));
    expect(mapped.getStatus()).toBe(502);
  });

  it('maps network failures (ECONNREFUSED etc.) to 503', () => {
    const err = axiosError(0, {}, 'ECONNREFUSED');
    delete (err as { response?: unknown }).response;
    const mapped = mapErrorToHttpException(err);
    expect(mapped).toBeInstanceOf(ServiceUnavailableException);
    expect(mapped.getStatus()).toBe(503);
  });

  it('maps connection timeouts to 503', () => {
    const err = new Error('timeout of 10000ms exceeded') as Error & { code?: string };
    err.code = 'ECONNABORTED';
    const mapped = mapErrorToHttpException(err);
    expect(mapped).toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps plain internal errors to 500 with the context in the message', () => {
    const mapped = mapErrorToHttpException(
      new Error('Cannot read properties of undefined'),
      'processing refund'
    );
    expect(mapped).toBeInstanceOf(InternalServerErrorException);
    expect(mapped.getStatus()).toBe(500);
    expect(mapped.message).toContain('processing refund');
    expect(mapped.message).toContain('Cannot read properties of undefined');
  });

  it('handles non-Error thrown values without crashing', () => {
    const mapped = mapErrorToHttpException('something string-like');
    expect(mapped).toBeInstanceOf(InternalServerErrorException);
    expect(mapped.getStatus()).toBe(500);
  });

  describe('Prisma error mapping', () => {
    function prismaError(code: string, meta?: Record<string, unknown>): Error {
      const err = new Error(`Unknown Prisma error (${code})`) as Error & {
        code?: string;
        meta?: Record<string, unknown>;
      };
      err.code = code;
      if (meta) err.meta = meta;
      return err;
    }

    it('maps P2025 (record not found) to 404 NotFoundException', () => {
      const mapped = mapErrorToHttpException(prismaError('P2025'));
      expect(mapped).toBeInstanceOf(NotFoundException);
      expect(mapped.getStatus()).toBe(404);
    });

    it('maps P2002 (unique violation) to 409 Conflict with field names', () => {
      const mapped = mapErrorToHttpException(
        prismaError('P2002', { target: ['email'], modelName: 'User' })
      );
      expect(mapped).toBeInstanceOf(ConflictException);
      expect(mapped.getStatus()).toBe(409);
      expect(mapped.message).toContain('email');
      expect(mapped.message).toContain('User');
    });

    it('maps P2003 (foreign-key failure) to 404', () => {
      const mapped = mapErrorToHttpException(prismaError('P2003'));
      expect(mapped).toBeInstanceOf(NotFoundException);
    });

    it('maps P2007/P2011 (validation) to 400', () => {
      expect(mapErrorToHttpException(prismaError('P2007'))).toBeInstanceOf(BadRequestException);
      expect(mapErrorToHttpException(prismaError('P2011'))).toBeInstanceOf(BadRequestException);
    });

    it('maps P2012/P2013 (missing values) to 422', () => {
      expect(mapErrorToHttpException(prismaError('P2012'))).toBeInstanceOf(
        UnprocessableEntityException
      );
      expect(mapErrorToHttpException(prismaError('P2013'))).toBeInstanceOf(
        UnprocessableEntityException
      );
    });

    it('maps Prisma connection errors (P1001/P1002/P2024) to 503', () => {
      for (const code of ['P1001', 'P1002', 'P2024']) {
        const mapped = mapErrorToHttpException(prismaError(code), 'creating tip');
        expect(mapped).toBeInstanceOf(ServiceUnavailableException);
        expect(mapped.getStatus()).toBe(503);
        expect(mapped.message).toContain('Database');
      }
    });

    it('unknown Prisma codes still fall through to 500', () => {
      const mapped = mapErrorToHttpException(prismaError('P9999'));
      expect(mapped).toBeInstanceOf(InternalServerErrorException);
    });

    it('non-Prisma error codes (axios EAI_AGAIN etc.) are not treated as Prisma', () => {
      const err = new Error('upstream') as Error & { code?: string };
      err.code = 'EAI_AGAIN';
      const mapped = mapErrorToHttpException(err);
      expect(mapped).toBeInstanceOf(ServiceUnavailableException);
    });
  });

  it('mapAndThrow always throws the mapped exception', () => {
    expect(() =>
      mapAndThrow(axiosError(400, { message: 'bad input from upstream' }), 'calling upstream')
    ).toThrow(BadRequestException);

    expect(() => mapAndThrow(new Error('boom'))).toThrow(InternalServerErrorException);

    let caught: unknown;
    try {
      mapAndThrow(new NotFoundException('kept as-is'));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(404);
  });
});
