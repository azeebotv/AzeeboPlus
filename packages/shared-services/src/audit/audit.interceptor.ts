import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from './audit.decorator';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id?: string; role?: string };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    private auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<AuditLogOptions>(AUDIT_LOG_KEY, context.getHandler());

    if (!options || options.skipLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id || 'system';
    const actorType = request.user?.role === 'admin' ? 'admin' : 'user';
    const action = options.action || this.getActionFromRequest(request);
    const resourceType = options.resourceType || this.getResourceTypeFromRequest(request);
    const resourceId =
      request.params?.['id'] ||
      request.params?.['userId'] ||
      request.params?.['transactionId'] ||
      'unknown';
    const ipAddress = this.getClientIp(request);
    const userAgent =
      typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined;

    return next.handle().pipe(
      tap({
        next: async (data: unknown) => {
          try {
            await this.auditService.log({
              actorId: userId,
              actorType: actorType as 'user' | 'system' | 'admin',
              action,
              resourceType,
              resourceId: String(resourceId),
              ipAddress,
              userAgent: userAgent ?? '',
              status: 'success',
              newValue: typeof data === 'object'
                ? JSON.stringify(data).slice(0, 1000)
                : undefined,
            });
          } catch (error) {
            this.logger.error('Failed to log audit entry:', error);
          }
        },
        error: async (error: Error) => {
          try {
            await this.auditService.log({
              actorId: userId,
              actorType: actorType as 'user' | 'system' | 'admin',
              action,
              resourceType,
              resourceId: String(resourceId),
              ipAddress,
              userAgent: userAgent ?? '',
              status: 'failure',
              errorMessage: error.message,
            });
          } catch (logError) {
            this.logger.error('Failed to log audit error entry:', logError);
          }
        },
      })
    );
  }

  private getActionFromRequest(request: Request): string {
    const method = request.method.toLowerCase();
    const path = request.path;

    if (path.includes('refund')) return 'refund_processed';
    if (path.includes('ban')) return 'user_banned';
    if (path.includes('suspend')) return 'user_suspended';
    if (path.includes('role')) return 'role_changed';
    if (path.includes('transaction')) return 'transaction_processed';
    if (path.includes('override')) return 'admin_override';

    return `${method}_${path.split('/').filter(Boolean).slice(-1)[0] || 'unknown'}`;
  }

  private getResourceTypeFromRequest(request: Request): string {
    const path = request.path;

    if (path.includes('user') || path.includes('users')) return 'user';
    if (path.includes('transaction') || path.includes('transactions')) return 'transaction';
    if (path.includes('refund') || path.includes('refunds')) return 'refund';
    if (path.includes('admin')) return 'admin';

    return 'unknown';
  }

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return request.ip;
  }
}
