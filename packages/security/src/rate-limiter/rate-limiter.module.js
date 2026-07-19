"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RateLimiterModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterModule = void 0;
const common_1 = require("@nestjs/common");
const rate_limit_service_1 = require("./rate-limit.service");
const rate_limit_guard_1 = require("./rate-limit.guard");
const ioredis_1 = require("@nestjs-modules/ioredis");
let RateLimiterModule = RateLimiterModule_1 = class RateLimiterModule {
    static forRoot(config) {
        const redisUrl = config?.redisUrl || process.env.REDIS_URL;
        if (!redisUrl && process.env.NODE_ENV === 'production') {
            throw new Error('RateLimiterModule: REDIS_URL is required in production');
        }
        return {
            module: RateLimiterModule_1,
            imports: [
                ioredis_1.RedisModule.forRootAsync({
                    useFactory: () => ({
                        type: 'single',
                        url: redisUrl,
                    }),
                }),
            ],
            providers: [rate_limit_service_1.RateLimitService, rate_limit_guard_1.RateLimitGuard],
            exports: [rate_limit_service_1.RateLimitService, rate_limit_guard_1.RateLimitGuard],
        };
    }
    static register() {
        return this.forRoot();
    }
};
exports.RateLimiterModule = RateLimiterModule;
exports.RateLimiterModule = RateLimiterModule = RateLimiterModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], RateLimiterModule);
//# sourceMappingURL=rate-limiter.module.js.map