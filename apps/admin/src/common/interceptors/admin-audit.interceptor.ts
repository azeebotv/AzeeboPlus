import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogService } from '../../modules/audit/audit.service';
import { resolveActorId } from '../resolve-actor-id';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function extractTargetType(url: string): string {
  const clean = url.replace(/^\/api\/v\d+\/|^\/v\d+\/|^\//, '');
  const segments = clean.split('?')[0]?.split('/') || [];
  if (segments[0] === 'admin' && segments[1]) {
    return segments[1];
  }
  return segments[0] || 'system';
}

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(@Inject(AuditLogService) private readonly auditService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const method = req.method.toUpperCase();
    if (!MUTATION_METHODS.has(method)) {
      return next.handle();
    }

    const actorId = resolveActorId(req);
    const targetType = extractTargetType(req.originalUrl || req.url);
    const targetId = req.params?.id || req.body?.id || undefined;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] as string;

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire-and-forget background audit log recording
          void this.auditService
            .log({
              actorId,
              actorType: 'admin',
              action: `${method.toLowerCase()}:${req.route?.path || req.path || req.url}`,
              targetType,
              targetId,
              details: {
                statusCode: res.statusCode,
                query: req.query,
                bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : [],
              },
              ipAddress,
              userAgent,
            })
            .catch(() => {
              // Silently ignore audit logging secondary failures so response is not disturbed
            });
        },
      })
    );
  }
}
