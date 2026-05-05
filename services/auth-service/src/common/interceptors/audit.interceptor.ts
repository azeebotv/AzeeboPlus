import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_LOG_METADATA } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject(AuditService) private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const metadata = this.reflector.get(AUDIT_LOG_METADATA, context.getHandler());
    if (!metadata) {
      return next.handle();
    }

    const { action, resourceType } = metadata;
    const user = request.user;
    const actor = user?.id || user?.email || null;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (result) => {
          const resourceId = result?.id || result?.data?.id;
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
      }),
    );
  }

  private getClientIp(request: any): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.connection?.remoteAddress || request.socket?.remoteAddress;
  }
}
