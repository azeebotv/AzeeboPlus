"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseSanitizationInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const DEFAULT_EXCLUDE_FIELDS = [
    'password',
    'passwordHash',
    'token',
    'refreshToken',
    'secret',
    'apiKey',
    'secretKey',
];
const DEFAULT_MASK_FIELDS = ['email', 'phone', 'ssn'];
let ResponseSanitizationInterceptor = class ResponseSanitizationInterceptor {
    excludeFields = DEFAULT_EXCLUDE_FIELDS;
    maskFields = DEFAULT_MASK_FIELDS;
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)((response) => {
            if (!response || typeof response !== 'object') {
                return response;
            }
            return this.sanitizeObject(response);
        }));
    }
    sanitizeObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => typeof item === 'object' && item !== null
                ? this.sanitizeObject(item)
                : item);
        }
        const sanitized = { ...obj };
        for (const key of Object.keys(sanitized)) {
            if (this.excludeFields.includes(key)) {
                delete sanitized[key];
            }
            else if (this.maskFields.includes(key) && typeof sanitized[key] === 'string') {
                sanitized[key] = this.maskValue(sanitized[key]);
            }
            else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeObject(sanitized[key]);
            }
        }
        return sanitized;
    }
    maskValue(value) {
        if (value.length <= 4) {
            return '****';
        }
        return `${value.substring(0, 2)}****${value.substring(value.length - 2)}`;
    }
};
exports.ResponseSanitizationInterceptor = ResponseSanitizationInterceptor;
exports.ResponseSanitizationInterceptor = ResponseSanitizationInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseSanitizationInterceptor);
//# sourceMappingURL=response-sanitizer.interceptor.js.map