"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RequestValidationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RequestValidationMiddleware = RequestValidationMiddleware_1 = class RequestValidationMiddleware {
    logger = new common_1.Logger(RequestValidationMiddleware_1.name);
    MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
    use(req, res, next) {
        this.validateContentLength(req, res, next);
    }
    validateContentLength(req, res, next) {
        const contentLength = req.headers['content-length'];
        if (contentLength) {
            const length = parseInt(contentLength, 10);
            if (!isNaN(length) && length > this.MAX_REQUEST_SIZE) {
                this.logger.warn(`Request size exceeds limit: ${length} bytes`);
                res.status(413).json({
                    success: false,
                    message: 'Request entity too large',
                    maxSize: `${this.MAX_REQUEST_SIZE / (1024 * 1024)}MB`,
                });
                return;
            }
        }
        next();
    }
};
exports.RequestValidationMiddleware = RequestValidationMiddleware;
exports.RequestValidationMiddleware = RequestValidationMiddleware = RequestValidationMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], RequestValidationMiddleware);
