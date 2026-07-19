import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
export interface AdminGuardOptions {
    allowedRoles?: string[];
}
export declare class AdminGuard implements CanActivate {
    private jwtService;
    private options?;
    private allowedRoles;
    constructor(jwtService: JwtService, options?: AdminGuardOptions | undefined);
    canActivate(context: ExecutionContext): boolean;
}
