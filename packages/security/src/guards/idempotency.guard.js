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
var IdempotencyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const ioredis_1 = require("@nestjs-modules/ioredis");
const ioredis_2 = require("ioredis");
const public_decorator_1 = require("../decorators/public.decorator");
const IDEMPOTENCY_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL_SECONDS = 86400;
let IdempotencyGuard = IdempotencyGuard_1 = class IdempotencyGuard {
    reflector;
    redis;
    logger = new common_1.Logger(IdempotencyGuard_1.name);
    constructor(reflector, redis) {
        this.reflector = reflector;
        this.redis = redis;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = request.method?.toUpperCase();
        if (!['POST', 'PUT', 'PATCH'].includes(method)) {
            return true;
        }
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const idempotencyKey = request.headers['idempotency-key'];
        if (!idempotencyKey || typeof idempotencyKey !== 'string') {
            throw new common_1.ConflictException('Missing Idempotency-Key header. All mutating requests must include a unique Idempotency-Key.');
        }
        if (idempotencyKey.length < 4 || idempotencyKey.length > 255) {
            throw new common_1.ConflictException('Idempotency-Key must be between 4 and 255 characters.');
        }
        const redisKey = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;
        try {
            const existing = await this.redis.get(redisKey);
            if (existing) {
                throw new common_1.ConflictException('Request with this Idempotency-Key has already been processed.');
            }
            const reserved = await this.redis.set(redisKey, 'processing', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');
            if (!reserved) {
                throw new common_1.ConflictException('Request with this Idempotency-Key has already been processed.');
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error(`Redis idempotency check failed: ${error}`);
        }
        request.idempotencyKey = idempotencyKey;
        return true;
    }
};
exports.IdempotencyGuard = IdempotencyGuard;
exports.IdempotencyGuard = IdempotencyGuard = IdempotencyGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [core_1.Reflector,
        ioredis_2.Redis])
], IdempotencyGuard);
//# sourceMappingURL=idempotency.guard.js.map