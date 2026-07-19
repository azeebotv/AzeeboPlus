"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCors = configureCors;
function configureCors(app, options) {
    const { allowedOrigins, credentials = true, maxAge = 3600 } = options;
    const validatedOrigins = allowedOrigins.map((origin) => {
        if (origin === '*') {
            throw new Error('CORS wildcard (*) is not allowed for security reasons');
        }
        try {
            new URL(origin);
            return origin;
        }
        catch {
            throw new Error(`Invalid CORS origin: ${origin}`);
        }
    });
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            const isAllowed = validatedOrigins.some((allowed) => allowed === origin);
            if (isAllowed) {
                callback(null, true);
            }
            else {
                callback(new Error(`Not allowed by CORS - origin: ${origin}`));
            }
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        credentials,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-Request-ID',
            'Idempotency-Key',
            'X-Feature-Flag',
            'Accept',
            'Origin',
        ],
        exposedHeaders: [
            'Content-Disposition',
            'X-Request-ID',
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining',
        ],
        maxAge,
    });
}
//# sourceMappingURL=cors.config.js.map