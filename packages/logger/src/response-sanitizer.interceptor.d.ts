import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface SanitizationConfig {
    excludeFields?: string[];
    maskFields?: string[];
}
export declare class ResponseSanitizationInterceptor implements NestInterceptor {
    private readonly excludeFields;
    private readonly maskFields;
    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private sanitizeObject;
    private maskValue;
}
