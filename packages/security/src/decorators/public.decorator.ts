import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to identify public routes that do not require authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route or controller as public (no authentication required).
 * Use sparingly — only for health checks, public content, and auth endpoints.
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
