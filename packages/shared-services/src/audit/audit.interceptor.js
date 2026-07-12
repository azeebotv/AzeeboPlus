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
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const audit_service_1 = require("./audit.service");
const audit_decorator_1 = require("./audit.decorator");
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    reflector;
    auditService;
    logger = new common_1.Logger(AuditInterceptor_1.name);
    constructor(reflector, auditService) {
        this.reflector = reflector;
        this.auditService = auditService;
    }
    intercept(context, next) {
        const options = this.reflector.get(audit_decorator_1.AUDIT_LOG_KEY, context.getHandler());
        if (!options || options.skipLog) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id || 'system';
        const actorType = request.user?.role === 'admin' ? 'admin' : 'user';
        const action = options.action || this.getActionFromRequest(request);
        const resourceType = options.resourceType || this.getResourceTypeFromRequest(request);
        const resourceId = request.params?.['id'] ||
            request.params?.['userId'] ||
            request.params?.['transactionId'] ||
            'unknown';
        const ipAddress = this.getClientIp(request);
        const userAgent = typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined;
        return next.handle().pipe((0, rxjs_1.tap)({
            next: async (data) => {
                try {
                    await this.auditService.log({
                        actorId: userId,
                        actorType: actorType,
                        action,
                        resourceType,
                        resourceId: String(resourceId),
                        ipAddress,
                        userAgent: userAgent ?? '',
                        status: 'success',
                        newValue: typeof data === 'object' ? JSON.stringify(data).slice(0, 1000) : undefined,
                    });
                }
                catch (error) {
                    this.logger.error('Failed to log audit entry:', error);
                }
            },
            error: async (error) => {
                try {
                    await this.auditService.log({
                        actorId: userId,
                        actorType: actorType,
                        action,
                        resourceType,
                        resourceId: String(resourceId),
                        ipAddress,
                        userAgent: userAgent ?? '',
                        status: 'failure',
                        errorMessage: error.message,
                    });
                }
                catch (logError) {
                    this.logger.error('Failed to log audit error entry:', logError);
                }
            },
        }));
    }
    getActionFromRequest(request) {
        const method = request.method.toLowerCase();
        const path = request.path;
        if (path.includes('refund'))
            return 'refund_processed';
        if (path.includes('ban'))
            return 'user_banned';
        if (path.includes('suspend'))
            return 'user_suspended';
        if (path.includes('role'))
            return 'role_changed';
        if (path.includes('transaction'))
            return 'transaction_processed';
        if (path.includes('override'))
            return 'admin_override';
        return `${method}_${path.split('/').filter(Boolean).slice(-1)[0] || 'unknown'}`;
    }
    getResourceTypeFromRequest(request) {
        const path = request.path;
        if (path.includes('user') || path.includes('users'))
            return 'user';
        if (path.includes('transaction') || path.includes('transactions'))
            return 'transaction';
        if (path.includes('refund') || path.includes('refunds'))
            return 'refund';
        if (path.includes('admin'))
            return 'admin';
        return 'unknown';
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
        }
        return request.ip;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_service_1.AuditService])
], AuditInterceptor);
