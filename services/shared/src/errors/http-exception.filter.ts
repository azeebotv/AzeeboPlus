import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    const responseBody = exception.getResponse();
    const message = typeof responseBody === 'string' 
      ? responseBody 
      : (responseBody as Record<string, unknown>).message || 'An error occurred';

    this.logger.warn(`HTTP exception: ${status} - ${message}`, exception.stack);

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request?.originalUrl,
    });
  }
}
