import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
export declare class ServiceAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwtService?;
    constructor(reflector: Reflector, jwtService?: JwtService | undefined);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
