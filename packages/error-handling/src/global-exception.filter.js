"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    logger = new common_1.Logger('ExceptionFilter');
    getProblemTypeUri(status) {
        return `https://api.azeeboplus.com/problems/${status}`;
    }
    getProblemTitle(status) {
        const titles = {
            [common_1.HttpStatus.BAD_REQUEST]: 'Bad Request',
            [common_1.HttpStatus.UNAUTHORIZED]: 'Unauthorized',
            [common_1.HttpStatus.FORBIDDEN]: 'Forbidden',
            [common_1.HttpStatus.NOT_FOUND]: 'Not Found',
            [common_1.HttpStatus.CONFLICT]: 'Conflict',
            [common_1.HttpStatus.UNPROCESSABLE_ENTITY]: 'Validation Error',
            [common_1.HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
            [common_1.HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
            [common_1.HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
            [common_1.HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
            [common_1.HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
        };
        return titles[status] || 'Error';
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        let status;
        let message;
        let error;
        let code;
        let details;
        if (exception instanceof types_1.AppError) {
            status = exception.statusCode;
            message = exception.message;
            error = exception.error;
            code = exception.error;
            details = exception.details;
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse;
                const rawMessage = responseObj.message;
                message = Array.isArray(rawMessage)
                    ? rawMessage.join(', ')
                    : rawMessage || exception.message;
                error = responseObj.error || exception.name;
                code = responseObj.code || error;
                details = responseObj.details;
            }
            else {
                message = exception.message;
                error = exception.name;
                code = exception.name;
            }
        }
        else if (exception instanceof Error) {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';
            code = 'INTERNAL_SERVER_ERROR';
            this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unknown error occurred';
            error = 'Internal Server Error';
            code = 'INTERNAL_SERVER_ERROR';
            this.logger.error(`Unknown exception type: ${exception}`);
        }
        const errorResponse = {
            success: false,
            type: this.getProblemTypeUri(status),
            title: this.getProblemTitle(status),
            status,
            detail: message,
            instance: request?.url,
            code,
            message,
            error,
            statusCode: status,
            ...(details ? { details } : {}),
            timestamp: new Date().toISOString(),
            path: request?.url,
        };
        response.status(status).json(errorResponse);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map