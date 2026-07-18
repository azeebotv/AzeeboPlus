"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseWrapper = void 0;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
exports.createCreatedResponse = createCreatedResponse;
exports.createNoContentResponse = createNoContentResponse;
class ApiResponseWrapper {
    static success(data, meta) {
        return {
            success: true,
            data,
            ...(meta && { meta }),
        };
    }
    static error(code, message, details) {
        const error = {
            code,
            message,
            ...(details && { details }),
        };
        return {
            success: false,
            error,
        };
    }
    static created(data, meta) {
        return {
            success: true,
            data,
            ...(meta && { meta }),
        };
    }
    static paginated(data, page, limit, total) {
        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
        return {
            success: true,
            data,
            meta,
        };
    }
    static noContent() {
        return {
            success: true,
            data: null,
        };
    }
}
exports.ApiResponseWrapper = ApiResponseWrapper;
function createSuccessResponse(data, meta) {
    return ApiResponseWrapper.success(data, meta);
}
function createErrorResponse(code, message, details) {
    return ApiResponseWrapper.error(code, message, details);
}
function createPaginatedResponse(data, page, limit, total) {
    return ApiResponseWrapper.paginated(data, page, limit, total);
}
function createCreatedResponse(data, meta) {
    return ApiResponseWrapper.created(data, meta);
}
function createNoContentResponse() {
    return ApiResponseWrapper.noContent();
}
//# sourceMappingURL=api-response.js.map