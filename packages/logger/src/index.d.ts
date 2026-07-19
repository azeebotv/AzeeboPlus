import { LoggerService, LogLevel } from '@nestjs/common';
export { LoggingInterceptor } from './logging.interceptor';
export { ResponseWrapperInterceptor } from './response-wrapper.interceptor';
export { ResponseSanitizationInterceptor, SanitizationConfig, } from './response-sanitizer.interceptor';
export { DistributedTracingInterceptor, createTraceHeaders, } from './distributed-tracing.interceptor';
export type { TraceContext } from './distributed-tracing.interceptor';
export interface LogContext {
    traceId?: string;
    spanId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
}
export interface StructuredLogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service: string;
    traceId?: string;
    spanId?: string;
    userId?: string;
    requestId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
    error?: Error;
    [key: string]: unknown;
}
export declare function getTraceContext(): {
    traceId?: string;
    spanId?: string;
};
export declare class StructuredLogger implements LoggerService {
    private readonly serviceName;
    constructor(serviceName: string);
    log(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    error(message: string, trace?: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    private write;
}
export declare function createLogger(serviceName: string): StructuredLogger;
