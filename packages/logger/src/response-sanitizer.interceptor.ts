import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SanitizationConfig {
  excludeFields?: string[];
  maskFields?: string[];
}

const DEFAULT_EXCLUDE_FIELDS = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'apiKey', 'secretKey'];
const DEFAULT_MASK_FIELDS = ['email', 'phone', 'ssn'];

@Injectable()
export class ResponseSanitizationInterceptor implements NestInterceptor {
  private readonly excludeFields: string[];
  private readonly maskFields: string[];

  constructor(config?: SanitizationConfig) {
    this.excludeFields = config?.excludeFields || DEFAULT_EXCLUDE_FIELDS;
    this.maskFields = config?.maskFields || DEFAULT_MASK_FIELDS;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((response: unknown) => {
        if (!response || typeof response !== 'object') {
          return response;
        }

        return this.sanitizeObject(response as Record<string, unknown>);
      })
    );
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...obj };

    for (const key of Object.keys(sanitized)) {
      if (this.excludeFields.includes(key)) {
        delete sanitized[key];
      } else if (this.maskFields.includes(key) && typeof sanitized[key] === 'string') {
        sanitized[key] = this.maskValue(sanitized[key] as string);
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key] as Record<string, unknown>);
      }
    }

    return sanitized;
  }

  private maskValue(value: string): string {
    if (value.length <= 4) {
      return '****';
    }
    return `${value.substring(0, 2)}****${value.substring(value.length - 2)}`;
  }
}
