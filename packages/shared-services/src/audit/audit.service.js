"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(auditData) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    actorId: auditData.actorId,
                    actorType: auditData.actorType,
                    action: auditData.action,
                    resourceType: auditData.resourceType,
                    resourceId: auditData.resourceId,
                    previousValue: auditData.previousValue,
                    newValue: auditData.newValue,
                    ipAddress: auditData.ipAddress,
                    userAgent: auditData.userAgent,
                    status: auditData.status,
                    errorMessage: auditData.errorMessage,
                    metadata: auditData.metadata ? JSON.stringify(auditData.metadata) : undefined,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to write audit log:', error);
        }
    }
    async logRefund(userId, transactionId, amount, status, errorMessage) {
        await this.log({
            actorId: userId,
            actorType: 'user',
            action: 'refund_processed',
            resourceType: 'transaction',
            resourceId: transactionId,
            metadata: { amount, errorMessage },
            status,
            errorMessage,
        });
    }
    async logUserBan(adminId, userId, reason) {
        await this.log({
            actorId: adminId,
            actorType: 'admin',
            action: 'user_banned',
            resourceType: 'user',
            resourceId: userId,
            metadata: { reason },
            status: 'success',
        });
    }
    async logUserSuspension(adminId, userId, reason, duration) {
        await this.log({
            actorId: adminId,
            actorType: 'admin',
            action: 'user_suspended',
            resourceType: 'user',
            resourceId: userId,
            metadata: { reason, duration },
            status: 'success',
        });
    }
    async logRoleChange(adminId, userId, oldRole, newRole) {
        await this.log({
            actorId: adminId,
            actorType: 'admin',
            action: 'role_changed',
            resourceType: 'user',
            resourceId: userId,
            previousValue: oldRole,
            newValue: newRole,
            status: 'success',
        });
    }
    async logLargeTransaction(userId, transactionId, amount, type) {
        await this.log({
            actorId: userId,
            actorType: 'user',
            action: `large_transaction_${type}`,
            resourceType: 'transaction',
            resourceId: transactionId,
            metadata: { amount, type },
            status: 'success',
        });
    }
    async logAdminOverride(adminId, action, resourceType, resourceId) {
        await this.log({
            actorId: adminId,
            actorType: 'admin',
            action: `admin_override_${action}`,
            resourceType,
            resourceId,
            status: 'success',
        });
    }
    async getAuditLogsByActor(actorId, limit = 100) {
        const logs = await this.prisma.auditLog.findMany({
            where: { actorId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return logs.map(this.mapToAuditEntry);
    }
    async getAuditLogsByResource(resourceType, resourceId, limit = 100) {
        const logs = await this.prisma.auditLog.findMany({
            where: { resourceType, resourceId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return logs.map(this.mapToAuditEntry);
    }
    async getAuditLogsByAction(action, limit = 100) {
        const logs = await this.prisma.auditLog.findMany({
            where: { action },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return logs.map(this.mapToAuditEntry);
    }
    mapToAuditEntry(log) {
        return {
            id: log.id,
            actorId: log.actorId,
            actorType: log.actorType,
            action: log.action,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            previousValue: log.previousValue ?? undefined,
            newValue: log.newValue ?? undefined,
            ipAddress: log.ipAddress ?? undefined,
            userAgent: log.userAgent ?? undefined,
            timestamp: log.createdAt,
            status: log.status,
            errorMessage: log.errorMessage ?? undefined,
            metadata: typeof log.metadata === 'string'
                ? (() => {
                    try {
                        return JSON.parse(log.metadata);
                    }
                    catch {
                        return undefined;
                    }
                })()
                : log.metadata,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
