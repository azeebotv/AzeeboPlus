import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route or controller to the given roles. Evaluated by
 * RolesGuard; without the guard the metadata is inert.
 *
 * @example
 * @Roles('moderator', 'admin')
 * @Delete(':id')
 * remove() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
