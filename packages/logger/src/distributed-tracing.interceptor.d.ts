import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    userId?: string;
    service?: string;
    startTime: number;
    tags?: Record<string, string>;
    baggage?: Record<string, string>;
}
export declare class DistributedTracingInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly serviceName;
    constructor();
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private extractOrCreateTraceContext;
    private getHeaderValue;
    private parseBaggage;
    private logTrace;
}
export declare function createTraceHeaders(context: TraceContext): Record<string, string>;
