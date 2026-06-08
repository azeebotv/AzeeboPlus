import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY, Permission } from '@azeebo/shared-types';

export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
