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
exports.DistributedTracingInterceptor = void 0;
exports.createTraceHeaders = createTraceHeaders;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const crypto_1 = require("crypto");
let DistributedTracingInterceptor = class DistributedTracingInterceptor {
    logger = new common_1.Logger('DistributedTracing');
    serviceName;
    constructor() {
        this.serviceName = process.env.SERVICE_NAME || 'unknown';
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const traceContext = this.extractOrCreateTraceContext(request);
        const method = request.method || 'UNKNOWN';
        const url = request.url || 'UNKNOWN';
        const startTime = Date.now();
        request.traceId = traceContext.traceId;
        request.spanId = traceContext.spanId;
        request.parentSpanId = traceContext.parentSpanId;
        response.setHeader('X-Trace-Id', traceContext.traceId);
        response.setHeader('X-Span-Id', traceContext.spanId);
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                this.logTrace({
                    ...traceContext,
                    method,
                    path: url,
                    statusCode,
                    duration,
                    success: true,
                });
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logTrace({
                    ...traceContext,
                    method,
                    path: url,
                    duration,
                    success: false,
                    error: {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                    },
                });
            },
        }));
    }
    extractOrCreateTraceContext(request) {
        const headers = request.headers || {};
        const existingTraceId = this.getHeaderValue(headers, 'x-trace-id');
        const existingSpanId = this.getHeaderValue(headers, 'x-span-id');
        const existingParentSpanId = this.getHeaderValue(headers, 'x-parent-span-id');
        const traceId = existingTraceId || (0, crypto_1.randomUUID)();
        const spanId = (0, crypto_1.randomUUID)().substring(0, 8);
        const parentSpanId = existingSpanId || existingParentSpanId;
        const baggageHeader = this.getHeaderValue(headers, 'x-trace-baggage');
        const baggage = baggageHeader ? this.parseBaggage(baggageHeader) : {};
        return {
            traceId,
            spanId,
            parentSpanId,
            userId: request.user?.id,
            service: this.serviceName,
            startTime: Date.now(),
            baggage,
        };
    }
    getHeaderValue(headers, key) {
        const value = headers[key];
        if (Array.isArray(value)) {
            return value[0];
        }
        return value;
    }
    parseBaggage(baggageHeader) {
        try {
            return baggageHeader.split(',').reduce((acc, pair) => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    acc[key.trim()] = decodeURIComponent(value.trim());
                }
                return acc;
            }, {});
        }
        catch {
            return {};
        }
    }
    logTrace(context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: context.success ? 'info' : 'error',
            message: `${context.method} ${context.path} ${context.statusCode || 'ERROR'} ${context.duration}ms`,
            traceId: context.traceId,
            spanId: context.spanId,
            parentSpanId: context.parentSpanId,
            userId: context.userId,
            service: context.service,
            method: context.method,
            path: context.path,
            statusCode: context.statusCode,
            duration: context.duration,
            success: context.success,
            baggage: context.baggage,
            ...(context.error && { error: context.error }),
        };
        if (context.success) {
            this.logger.log(JSON.stringify(logEntry));
        }
        else {
            this.logger.error(JSON.stringify(logEntry));
        }
    }
};
exports.DistributedTracingInterceptor = DistributedTracingInterceptor;
exports.DistributedTracingInterceptor = DistributedTracingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DistributedTracingInterceptor);
function createTraceHeaders(context) {
    const headers = {
        'X-Trace-Id': context.traceId,
        'X-Span-Id': context.spanId,
    };
    if (context.parentSpanId) {
        headers['X-Parent-Span-Id'] = context.parentSpanId;
    }
    if (context.baggage && Object.keys(context.baggage).length > 0) {
        const baggageString = Object.entries(context.baggage)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join(',');
        headers['X-Trace-Baggage'] = baggageString;
    }
    return headers;
}
//# sourceMappingURL=distributed-tracing.interceptor.js.map