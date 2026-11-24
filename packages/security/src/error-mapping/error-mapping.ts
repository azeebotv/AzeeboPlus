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

/**
 * Error-mapping helpers for service-layer catch blocks.
 *
 * THE ANTI-PATTERN THESE REPLACE:
 *   try { ... } catch (error) {
 *     throw new NotFoundException('...');   // internal failure reported as client error
 *   }
 *
 * A catch-all must NOT convert internal/infrastructure failures into 4xx:
 *   - 4xx tells the client "you made a mistake" and pollutes client error
 *     tracking, masks outages, and breaks retry/monitoring semantics.
 *   - Genuine client errors (4xx) arriving from an upstream service SHOULD be
 *     preserved so the client sees the real reason (e.g. "insufficient funds").
 *
 * Correct usage in a catch block:
 *   catch (error) {
 *     mapAndThrow(error, 'wallet debit');
 *   }
 */

/** Structural shape of an axios error (duck-typed to avoid an axios dependency). */
interface UpstreamErrorShape {
  response?: { status?: number; data?: { message?: string; error?: string } };
  code?: string;
  message?: string;
  meta?: { target?: string[]; fields?: string[]; modelName?: string };
}

/** Prisma known-request error codes with client-facing semantics. */
const PRISMA_CODE_TO_EXCEPTION: Record<string, new (message: string) => HttpException> = {
  // Record to update/delete not found — the queried row is gone: client asked
  // for something that no longer exists → 404, not 500.
  P2025: NotFoundException,
  // Unique-constraint violation — the client is trying to create a duplicate
  // (same email, same tip idempotency key, …) → 409 Conflict.
  P2002: ConflictException,
  // Foreign-key constraint failure — referenced record does not exist.
  P2003: NotFoundException,
  // Query engine validation error (bad value shape) → 400.
  P2007: BadRequestException,
  // Data validation error at the connector level → 400.
  P2011: BadRequestException,
  // Null-constraint violation on a required column → 422.
  P2012: UnprocessableEntityException,
  // Missing required value → 422.
  P2013: UnprocessableEntityException,
};

/** Prisma connection/infrastructure error codes → 503 (retryable). */
const PRISMA_INFRA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNRESET',
  'EPIPE',
]);

const STATUS_TO_EXCEPTION: Record<number, new (message: string) => HttpException> = {
  400: BadRequestException,
  401: UnauthorizedException,
  403: ForbiddenException,
  404: NotFoundException,
  409: ConflictException,
  422: UnprocessableEntityException,
};

function asUpstreamError(error: unknown): UpstreamErrorShape | undefined {
  if (error instanceof Error) {
    return error as unknown as UpstreamErrorShape;
  }
  return undefined;
}

function getUpstreamStatus(error: unknown): number | undefined {
  const shaped = asUpstreamError(error);
  const status = shaped?.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function isNetworkError(error: unknown): boolean {
  const shaped = asUpstreamError(error);
  return !!shaped?.code && NETWORK_ERROR_CODES.has(shaped.code);
}

function getPrismaErrorCode(error: unknown): string | undefined {
  const shaped = asUpstreamError(error);
  const code = shaped?.code;
  return typeof code === 'string' && code.startsWith('P') ? code : undefined;
}

function describePrismaError(error: unknown): string {
  const shaped = asUpstreamError(error);
  const fields = shaped?.meta?.target ?? shaped?.meta?.fields;
  const model = shaped?.meta?.modelName;
  const fieldPart = Array.isArray(fields) && fields.length > 0 ? ` on ${fields.join(', ')}` : '';
  const modelPart = model ? ` (${model})` : '';
  return `${shaped?.message ?? 'Database constraint violated'}${fieldPart}${modelPart}`;
}

function extractUpstreamMessage(error: unknown): string {
  const shaped = asUpstreamError(error);
  return (
    shaped?.response?.data?.message ||
    shaped?.response?.data?.error ||
    shaped?.message ||
    'Upstream request failed'
  );
}

/**
 * Convert any caught error into the appropriate HttpException:
 *
 *  - HttpException already           → rethrown unchanged (real client errors survive)
 *  - CircuitBreakerOpenError          → 503 ServiceUnavailable (fail-fast, retry later)
 *  - Prisma P2025/P2003/P2002/P2007…  → matching 4xx (404/409/400/422)
 *  - Prisma infra codes (P1001, …)    → 503 ServiceUnavailable (retryable)
 *  - upstream 4xx (axios-style)       → matching 4xx (client's genuine fault preserved)
 *  - upstream 5xx (axios-style)       → 502 BadGateway (upstream is broken, not the client)
 *  - network failure (ECONN*, etc.)   → 503 ServiceUnavailable
 *  - anything else                    → 500 InternalServerError
 */
export function mapErrorToHttpException(error: unknown, context?: string): HttpException {
  if (error instanceof HttpException) {
    return error;
  }

  if (error instanceof CircuitBreakerOpenError) {
    return new ServiceUnavailableException(
      `${context ?? 'Dependent service'} is temporarily unavailable. Please try again shortly.`
    );
  }

  const prismaCode = getPrismaErrorCode(error);

  if (prismaCode && PRISMA_INFRA_CODES.has(prismaCode)) {
    return new ServiceUnavailableException(
      `Database is temporarily unavailable${context ? ` while ${context}` : ''}. Please try again shortly.`
    );
  }

  if (prismaCode && PRISMA_CODE_TO_EXCEPTION[prismaCode]) {
    return new PRISMA_CODE_TO_EXCEPTION[prismaCode](describePrismaError(error));
  }

  const status = getUpstreamStatus(error);

  if (status !== undefined) {
    if (status >= 400 && status < 500) {
      const ExceptionCtor = STATUS_TO_EXCEPTION[status];
      if (ExceptionCtor) {
        return new ExceptionCtor(extractUpstreamMessage(error));
      }
    }
    return new BadGatewayException(
      `${context ?? 'Upstream service'} failed: ${extractUpstreamMessage(error)}`
    );
  }

  if (isNetworkError(error)) {
    return new ServiceUnavailableException(
      `${context ?? 'Dependent service'} is unreachable. Please try again shortly.`
    );
  }

  const detail = error instanceof Error ? error.message : String(error);
  return new InternalServerErrorException(
    `Internal error${context ? ` while ${context}` : ''}: ${detail}`
  );
}

/**
 * Map and throw in one call — designed for catch blocks:
 *   catch (error) {
 *     mapAndThrow(error, 'processing refund');
 *   }
 * Always throws; never returns (declared `never` so control flow narrows).
 */
export function mapAndThrow(error: unknown, context?: string): never {
  throw mapErrorToHttpException(error, context);
}
