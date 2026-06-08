import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogOptions {
  action?: string;
  resourceType?: string;
  skipLog?: boolean;
}

export const AuditLog = (options: AuditLogOptions = {}) => {
  return SetMetadata(AUDIT_LOG_KEY, options);
};
