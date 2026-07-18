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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limit_service_1 = require("./rate-limit.service");
const RateLimit = (limit, windowMs) => (0, common_1.SetMetadata)('rateLimit', { limit, windowMs });
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    reflector;
    rateLimitService;
    constructor(reflector, rateLimitService) {
        this.reflector = reflector;
        this.rateLimitService = rateLimitService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const clientIp = this.getClientIp(request);
        const isBlocked = await this.rateLimitService.isBlocked(clientIp);
        if (isBlocked) {
            response.setHeader('Retry-After', 3600);
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'IP address is blocked due to repeated violations.',
                error: 'Too Many Requests',
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const rateLimitOptions = this.reflector.get('rateLimit', context.getHandler());
        if (!rateLimitOptions) {
            return true;
        }
        const key = this.generateKey(clientIp, request.path);
        const result = await this.rateLimitService.checkRateLimit(key, rateLimitOptions);
        this.setRateLimitHeaders(response, result);
        if (!result.allowed) {
            await this.rateLimitService.recordViolation(clientIp);
            response.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Too many requests, please try again later.',
                error: 'Too Many Requests',
                retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
    getClientIp(request) {
        const hasGatewaySecret = !!request.headers['x-gateway-secret'];
        if (hasGatewaySecret) {
            const forwardedFor = request.headers['x-forwarded-for'];
            const forwardedForIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : undefined;
            const realIp = request.headers['x-real-ip'];
            const realIpString = typeof realIp === 'string' ? realIp : undefined;
            return (forwardedForIp || realIpString || request.ip || request.socket.remoteAddress || 'unknown');
        }
        return request.ip || request.socket.remoteAddress || 'unknown';
    }
    generateKey(ip, path) {
        return `ratelimit:${ip}:${path}`;
    }
    setRateLimitHeaders(response, result) {
        response.setHeader('X-RateLimit-Limit', result.limit);
        response.setHeader('X-RateLimit-Remaining', result.remaining);
        response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        rate_limit_service_1.RateLimitService])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map