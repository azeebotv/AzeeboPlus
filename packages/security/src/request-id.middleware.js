"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RequestIdMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdMiddleware = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let RequestIdMiddleware = RequestIdMiddleware_1 = class RequestIdMiddleware {
    logger = new common_1.Logger(RequestIdMiddleware_1.name);
    use(req, res, next) {
        const raw = req.headers['x-request-id'] || '';
        const sanitized = /^[a-zA-Z0-9\-_]{1,255}$/.test(raw) ? raw.substring(0, 255) : (0, crypto_1.randomUUID)();
        req.headers['x-request-id'] = sanitized;
        res.setHeader('X-Request-ID', sanitized);
        this.logger.debug(`Request ID: ${sanitized}`);
        next();
    }
};
exports.RequestIdMiddleware = RequestIdMiddleware;
exports.RequestIdMiddleware = RequestIdMiddleware = RequestIdMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], RequestIdMiddleware);
//# sourceMappingURL=request-id.middleware.js.map