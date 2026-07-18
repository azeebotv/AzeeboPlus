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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const public_decorator_1 = require("../decorators/public.decorator");
let ServiceAuthGuard = class ServiceAuthGuard {
    reflector;
    jwtService;
    constructor(reflector, jwtService) {
        this.reflector = reflector;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const userId = request.headers['x-user-id'] || request.headers['X-User-Id'];
        const userRole = request.headers['x-user-role'] || request.headers['X-User-Role'];
        const userEmail = request.headers['x-user-email'] || request.headers['X-User-Email'];
        const gatewaySecret = request.headers['x-gateway-secret'];
        const authHeader = request.headers['authorization'];
        if (!userId && !authHeader) {
            throw new common_1.UnauthorizedException('Authentication required. No user identity found in request.');
        }
        if (userId) {
            const expectedSecret = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
            if (!expectedSecret) {
                throw new common_1.UnauthorizedException('Gateway authentication not configured. Requests with x-user-* headers require a valid x-gateway-secret.');
            }
            const secretBuffer = Buffer.from(gatewaySecret || '');
            const expectedBuffer = Buffer.from(expectedSecret);
            if (secretBuffer.length !== expectedBuffer.length ||
                !(0, crypto_1.timingSafeEqual)(secretBuffer, expectedBuffer)) {
                throw new common_1.UnauthorizedException('Gateway authentication required. Requests with x-user-* headers must include a valid x-gateway-secret.');
            }
            request.user = {
                id: userId,
                sub: userId,
                role: userRole || 'user',
                email: userEmail || '',
            };
        }
        else if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type !== 'Bearer' || !token) {
                throw new common_1.UnauthorizedException('Invalid authorization header format.');
            }
            if (!this.jwtService) {
                throw new common_1.UnauthorizedException('JWT verification unavailable. This service does not have JwtModule configured for direct token authentication.');
            }
            try {
                const payload = this.jwtService.verify(token, {
                    audience: 'azeebo-api',
                    issuer: 'azeebo-auth',
                });
                request.user = {
                    id: payload.sub,
                    sub: payload.sub,
                    role: payload.role || 'user',
                    email: payload.email || '',
                };
            }
            catch {
                throw new common_1.UnauthorizedException('Invalid or expired token.');
            }
        }
        return true;
    }
};
exports.ServiceAuthGuard = ServiceAuthGuard;
exports.ServiceAuthGuard = ServiceAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService])
], ServiceAuthGuard);
//# sourceMappingURL=service-auth.guard.js.map