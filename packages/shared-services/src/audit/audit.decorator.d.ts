export declare const AUDIT_LOG_KEY = 'audit_log';
export interface AuditLogOptions {
  action?: string;
  resourceType?: string;
  skipLog?: boolean;
}
export declare const AuditLog: (
  options?: AuditLogOptions
) => import('@nestjs/common').CustomDecorator<string>;
