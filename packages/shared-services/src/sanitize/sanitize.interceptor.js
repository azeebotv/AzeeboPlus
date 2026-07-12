"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeInterceptor = exports.SENSITIVE_FIELDS = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
exports.SENSITIVE_FIELDS = [
    'password',
    'passwordhash',
    'hashedpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'secret',
    'secretkey',
    'apikey',
    'privatekey',
    'creditcard',
    'cardnumber',
    'cvv',
    'ssn',
    'socialsecuritynumber',
];
let SanitizeInterceptor = class SanitizeInterceptor {
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => this.sanitizeResponse(data)));
    }
    sanitizeResponse(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map((item) => this.sanitizeObject(item));
        }
        return this.sanitizeObject(data);
    }
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        const sanitized = { ...obj };
        for (const key of Object.keys(sanitized)) {
            if (exports.SENSITIVE_FIELDS.includes(key.toLowerCase())) {
                delete sanitized[key];
            }
            else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeResponse(sanitized[key]);
            }
        }
        return sanitized;
    }
};
exports.SanitizeInterceptor = SanitizeInterceptor;
exports.SanitizeInterceptor = SanitizeInterceptor = __decorate([
    (0, common_1.Injectable)()
], SanitizeInterceptor);
