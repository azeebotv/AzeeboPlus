"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ContentTypeMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentTypeMiddleware = void 0;
const common_1 = require("@nestjs/common");
let ContentTypeMiddleware = ContentTypeMiddleware_1 = class ContentTypeMiddleware {
    logger = new common_1.Logger(ContentTypeMiddleware_1.name);
    use(req, res, next) {
        if (this.isJsonRequest(req)) {
            const contentType = req.headers['content-type'];
            if (contentType && !contentType.includes('application/json')) {
                this.logger.warn(`Invalid content-type: ${contentType}`);
                res.status(415).json({
                    success: false,
                    message: 'Unsupported media type',
                    supportedTypes: ['application/json'],
                });
                return;
            }
        }
        next();
    }
    isJsonRequest(req) {
        const methodsWithBody = ['POST', 'PUT', 'PATCH'];
        return methodsWithBody.includes(req.method);
    }
};
exports.ContentTypeMiddleware = ContentTypeMiddleware;
exports.ContentTypeMiddleware = ContentTypeMiddleware = ContentTypeMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], ContentTypeMiddleware);
