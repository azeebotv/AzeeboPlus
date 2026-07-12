import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare const SENSITIVE_FIELDS: string[];
export declare class SanitizeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown>;
  private sanitizeResponse;
  private sanitizeObject;
}
