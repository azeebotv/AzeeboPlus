import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '../../modules/audit/audit.service';
import { AUDIT_LOG_METADATA } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject(AuditLogService) private auditService: AuditLogService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    const metadata = this.reflector.get(AUDIT_LOG_METADATA, context.getHandler());
    if (!metadata) {
      return next.handle();
    }

    const { action, resourceType } = metadata;
    const user = request.user as Record<string, unknown> | undefined;
    const actor = (user?.id as string) || (user?.email as string) || null;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (result) => {
          const resultObj = result as Record<string, unknown>;
          const resourceId = resultObj?.id || (resultObj?.data as Record<string, unknown>)?.id;
          this.auditService.log({
            actor,
            action,
            resourceType,
            resourceId: resourceId?.toString(),
            result: 'success',
            timestamp: new Date(),
            ipAddress,
            userAgent,
          });
        },
        error: (error) => {
          this.auditService.log({
            actor,
            action,
            resourceType,
            result: 'failure',
            error: error.message,
            timestamp: new Date(),
            ipAddress,
            userAgent,
          });
        },
      })
    );
  }

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedForIp =
      typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined;
    return forwardedForIp || request.connection?.remoteAddress || request.socket?.remoteAddress;
  }
}
