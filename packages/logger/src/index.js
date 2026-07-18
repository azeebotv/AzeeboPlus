"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredLogger = exports.createTraceHeaders = exports.DistributedTracingInterceptor = exports.ResponseSanitizationInterceptor = exports.ResponseWrapperInterceptor = exports.LoggingInterceptor = void 0;
exports.getTraceContext = getTraceContext;
exports.createLogger = createLogger;
const api_1 = require("@opentelemetry/api");
var logging_interceptor_1 = require("./logging.interceptor");
Object.defineProperty(exports, "LoggingInterceptor", { enumerable: true, get: function () { return logging_interceptor_1.LoggingInterceptor; } });
var response_wrapper_interceptor_1 = require("./response-wrapper.interceptor");
Object.defineProperty(exports, "ResponseWrapperInterceptor", { enumerable: true, get: function () { return response_wrapper_interceptor_1.ResponseWrapperInterceptor; } });
var response_sanitizer_interceptor_1 = require("./response-sanitizer.interceptor");
Object.defineProperty(exports, "ResponseSanitizationInterceptor", { enumerable: true, get: function () { return response_sanitizer_interceptor_1.ResponseSanitizationInterceptor; } });
var distributed_tracing_interceptor_1 = require("./distributed-tracing.interceptor");
Object.defineProperty(exports, "DistributedTracingInterceptor", { enumerable: true, get: function () { return distributed_tracing_interceptor_1.DistributedTracingInterceptor; } });
Object.defineProperty(exports, "createTraceHeaders", { enumerable: true, get: function () { return distributed_tracing_interceptor_1.createTraceHeaders; } });
function getTraceContext() {
    const span = api_1.trace.getActiveSpan();
    if (!span)
        return {};
    const spanContext = span.spanContext();
    return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
    };
}
class StructuredLogger {
    serviceName;
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    log(message, context) {
        this.write('log', message, context);
    }
    info(message, context) {
        this.write('log', message, context);
    }
    error(message, trace, context) {
        this.write('error', message, { ...context, trace });
    }
    warn(message, context) {
        this.write('warn', message, context);
    }
    debug(message, context) {
        this.write('debug', message, context);
    }
    verbose(message, context) {
        this.write('verbose', message, context);
    }
    write(level, message, context) {
        const traceContext = getTraceContext();
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: this.serviceName,
            ...traceContext,
            ...context,
        };
        let output;
        try {
            output = JSON.stringify(entry);
        }
        catch {
            output = JSON.stringify({
                timestamp: entry.timestamp,
                level: entry.level,
                message: entry.message,
                service: entry.service,
                error: 'Failed to serialize log entry',
            });
        }
        switch (level) {
            case 'error':
            case 'warn':
                console.error(output);
                break;
            default:
                console.log(output);
        }
    }
}
exports.StructuredLogger = StructuredLogger;
function createLogger(serviceName) {
    return new StructuredLogger(serviceName);
}
//# sourceMappingURL=index.js.map