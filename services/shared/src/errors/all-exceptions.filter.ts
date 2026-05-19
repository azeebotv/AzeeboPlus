import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let statusCode = 500;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (typeof exception === 'object' && exception !== null) {
      if ('getStatus' in exception && typeof exception.getStatus === 'function') {
        statusCode = exception.getStatus();
      }
      if ('message' in exception) {
        message = String(exception.message);
      }
      if ('name' in exception) {
        error = String(exception.name);
      }
    }

    this.logger.error(`Exception caught: ${error}`, exception);

    const responseBody = {
      success: false,
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request?.originalUrl,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }
}
