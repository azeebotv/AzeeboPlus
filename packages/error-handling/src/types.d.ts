export interface ErrorResponse {
    success: boolean;
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    code?: string;
    message: string;
    error?: string;
    statusCode?: number;
    details?: {
        fieldErrors?: Record<string, string[]>;
        [key: string]: unknown;
    };
    timestamp?: string;
    path?: string;
}
export interface ApiError {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    code?: string;
    message: string;
    error?: string;
    statusCode?: number;
    details?: {
        fieldErrors?: Record<string, string[]>;
        [key: string]: unknown;
    };
    timestamp?: string;
    path?: string;
}
export declare class AppError extends Error {
    statusCode: number;
    error: string;
    details?: Record<string, unknown> | undefined;
    constructor(statusCode: number, error: string, message: string, details?: Record<string, unknown> | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(details: Record<string, string[]>);
}
export declare class BadRequestError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string, retryAfter?: number);
}
export declare class UnprocessableEntityError extends AppError {
    constructor(message?: string, details?: unknown);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string, details?: unknown);
}
