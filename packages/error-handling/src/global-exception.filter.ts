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

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      error = exception.error;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || exception.name;
        details = responseObj.details as Record<string, unknown> | undefined;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.isProduction ? 'Internal server error' : exception.message;
      error = 'Internal Server Error';

      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.isProduction ? 'Internal server error' : 'An unknown error occurred';
      error = 'Internal Server Error';

      this.logger.error(`Unknown exception type: ${exception}`);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        statusCode: status,
        error,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        traceId: (request.headers['x-request-id'] as string) || undefined,
        ...(details ? { details } : {}),
      },
    };

    if (!this.isProduction && exception instanceof Error) {
      errorResponse.error.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
