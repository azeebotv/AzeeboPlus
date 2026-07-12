import { PrismaService } from '../prisma/prisma.service';
export interface AuditEntry {
  id: string;
  actorId: string;
  actorType: 'user' | 'system' | 'admin';
  action: string;
  resourceType: string;
  resourceId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}
export declare class AuditService {
  private prisma;
  private readonly logger;
  constructor(prisma: PrismaService);
  log(auditData: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void>;
  logRefund(
    userId: string,
    transactionId: string,
    amount: number,
    status: 'success' | 'failure',
    errorMessage?: string
  ): Promise<void>;
  logUserBan(adminId: string, userId: string, reason: string): Promise<void>;
  logUserSuspension(
    adminId: string,
    userId: string,
    reason: string,
    duration?: string
  ): Promise<void>;
  logRoleChange(adminId: string, userId: string, oldRole: string, newRole: string): Promise<void>;
  logLargeTransaction(
    userId: string,
    transactionId: string,
    amount: number,
    type: 'credit' | 'debit'
  ): Promise<void>;
  logAdminOverride(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string
  ): Promise<void>;
  getAuditLogsByActor(actorId: string, limit?: number): Promise<AuditEntry[]>;
  getAuditLogsByResource(
    resourceType: string,
    resourceId: string,
    limit?: number
  ): Promise<AuditEntry[]>;
  getAuditLogsByAction(action: string, limit?: number): Promise<AuditEntry[]>;
  private mapToAuditEntry;
}
