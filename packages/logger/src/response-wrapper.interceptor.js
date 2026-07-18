"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseWrapperInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const shared_types_1 = require("@azeebo/shared-types");
let ResponseWrapperInterceptor = class ResponseWrapperInterceptor {
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)((response) => {
            if (this.isApiResponse(response)) {
                return response;
            }
            return shared_types_1.ApiResponseWrapper.success(response);
        }));
    }
    isApiResponse(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }
        const resp = response;
        if (typeof resp.success === 'boolean') {
            return true;
        }
        return false;
    }
};
exports.ResponseWrapperInterceptor = ResponseWrapperInterceptor;
exports.ResponseWrapperInterceptor = ResponseWrapperInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseWrapperInterceptor);
//# sourceMappingURL=response-wrapper.interceptor.js.map