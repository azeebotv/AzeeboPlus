import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_METADATA = 'audit_log_metadata';

export function AuditLog(action: string, resourceType?: string) {
  return SetMetadata(AUDIT_LOG_METADATA, { action, resourceType });
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
