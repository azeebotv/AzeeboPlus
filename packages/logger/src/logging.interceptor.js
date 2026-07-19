"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const crypto_1 = require("crypto");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const traceId = request.headers['x-request-id'] || (0, crypto_1.randomUUID)();
        const spanId = (0, crypto_1.randomUUID)().substring(0, 8);
        const { method, url } = request;
        const startTime = Date.now();
        request.traceId = traceId;
        request.spanId = spanId;
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                this.logger.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: `${method} ${url} ${statusCode} ${duration}ms`,
                    service: process.env.SERVICE_NAME || 'unknown',
                    traceId,
                    spanId,
                    userId: request.user?.id,
                    method,
                    path: url,
                    statusCode,
                    duration,
                }));
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logger.error(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: `${method} ${url} ERROR ${duration}ms - ${error.message}`,
                    service: process.env.SERVICE_NAME || 'unknown',
                    traceId,
                    spanId,
                    userId: request.user?.id,
                    method,
                    path: url,
                    duration,
                    error: {
                        name: error.name,
                        message: error.message,
                    },
                }));
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map