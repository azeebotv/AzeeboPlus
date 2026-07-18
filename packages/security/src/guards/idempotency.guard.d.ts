import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
export declare class IdempotencyGuard implements CanActivate {
    private readonly reflector;
    private readonly redis;
    private readonly logger;
    constructor(reflector: Reflector, redis: Redis);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
