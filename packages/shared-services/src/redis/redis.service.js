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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    redis;
    constructor() {
        const url = process.env.REDIS_URL;
        if (!url) {
            throw new Error('REDIS_URL environment variable must be set');
        }
        this.redis = new ioredis_1.Redis(url);
    }
    async get(key) {
        return this.redis.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.redis.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.redis.set(key, value);
        }
    }
    async incr(key) {
        return this.redis.incr(key);
    }
    async expire(key, seconds) {
        return this.redis.expire(key, seconds);
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async del(key) {
        return this.redis.del(key);
    }
    async scanKeys(pattern, count = 100) {
        const keys = [];
        let cursor = '0';
        do {
            const [nextCursor, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
            cursor = nextCursor;
            keys.push(...batch);
        } while (cursor !== '0');
        return keys;
    }
    async getClient() {
        return this.redis;
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
