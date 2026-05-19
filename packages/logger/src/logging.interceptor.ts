import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

interface LoggingRequest extends Request {
  user?: { id?: string };
  traceId?: string;
  spanId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<LoggingRequest>();
    const response = context.switchToHttp().getResponse();

    const traceId = (request.headers['x-request-id'] as string) || uuidv4();
    const spanId = uuidv4().substring(0, 8);
    const { method, url } = request;
    const startTime = Date.now();

    request.traceId = traceId;
    request.spanId = spanId;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `${method} ${url} ${statusCode} ${duration}ms`,
              service: process.env.SERVICE_NAME || 'unknown',
              traceId,
              spanId,
              userId: request.user?.id,
              method,
              path: url,
              statusCode,
              duration,
            })
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          this.logger.error(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `${method} ${url} ERROR ${duration}ms - ${error.message}`,
              service: process.env.SERVICE_NAME || 'unknown',
              traceId,
              spanId,
              userId: request.user?.id,
              method,
              path: url,
              duration,
              error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
              },
            })
          );
        },
      })
    );
  }
}
