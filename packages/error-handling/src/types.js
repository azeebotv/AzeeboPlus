"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.UnprocessableEntityError = exports.TooManyRequestsError = exports.ConflictError = exports.BadRequestError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    error;
    details;
    constructor(statusCode, error, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.details = details;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource, id) {
        super(404, 'Not Found', `${resource} with id ${id} not found`);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, 'Unauthorized', message);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(403, 'Forbidden', message);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends AppError {
    constructor(details) {
        super(422, 'Validation Error', 'Input validation failed', details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class BadRequestError extends AppError {
    constructor(message) {
        super(400, 'Bad Request', message);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}
exports.BadRequestError = BadRequestError;
class ConflictError extends AppError {
    constructor(message) {
        super(409, 'Conflict', message);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests', retryAfter) {
        super(429, 'Too Many Requests', message, retryAfter ? { retryAfter } : undefined);
        Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable entity', details) {
        super(422, 'UNPROCESSABLE_ENTITY', message, details);
        Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
    }
}
exports.UnprocessableEntityError = UnprocessableEntityError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable', details) {
        super(503, 'SERVICE_UNAVAILABLE', message, details);
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=types.js.map