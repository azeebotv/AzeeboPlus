import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError, ErrorResponse } from './types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * Derive an RFC 7807 problem type URI from the HTTP status code.
   * @see https://www.rfc-editor.org/rfc/rfc9457#name-https-api-rfc9110org-
   */
  private getProblemTypeUri(status: number): string {
    return `https://api.azeebo.com/problems/${status}`;
  }

  /**
   * Derive an RFC 7807 title from the HTTP status code.
   */
  private getProblemTitle(status: number): string {
    const titles: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Validation Error',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
    };
    return titles[status] || 'Error';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let error: string;
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      error = exception.error;
      code = exception.error;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        const rawMessage = responseObj.message;
        message = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : (rawMessage as string) || exception.message;
        error = (responseObj.error as string) || exception.name;
        code = (responseObj.code as string) || error;
        details = responseObj.details as Record<string, unknown> | undefined;
      } else {
        message = exception.message;
        error = exception.name;
        code = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.isProduction ? 'Internal server error' : exception.message;
      error = 'Internal Server Error';
      code = 'INTERNAL_SERVER_ERROR';

      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.isProduction ? 'Internal server error' : 'An unknown error occurred';
      error = 'Internal Server Error';
      code = 'INTERNAL_SERVER_ERROR';

      this.logger.error(`Unknown exception type: ${exception}`);
    }

    // RFC 7807 (Problem Details for HTTP APIs) response envelope
    const errorResponse: ErrorResponse = {
      success: false,

      // RFC 7807 core fields
      type: this.getProblemTypeUri(status),
      title: this.getProblemTitle(status),
      status,
      detail: message,
      instance: request?.url,

      // Application-level fields
      code,
      message,
      error,
      statusCode: status,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request?.url,
    };

    response.status(status).json(errorResponse);
  }
}
