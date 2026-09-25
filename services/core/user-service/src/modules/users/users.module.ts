import { Module } from '@nestjs/common';
import { CacheModule, JwtConfigModule } from '@azeebo/shared-services';

import { UsersController } from './users.controller.js';
import { InteractionsController } from './interactions.controller.js';
import { UsersService } from './users.service.js';
import { AvatarService } from './avatar.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { UserDeletionController } from '../user/user-deletion.controller.js';

@Module({
  imports: [DatabaseModule, CacheModule, JwtConfigModule],
  controllers: [UsersController, InteractionsController, UserDeletionController],
  providers: [UsersService, AvatarService],
  exports: [UsersService, AvatarService, DatabaseModule],
})
export class UsersModule {}
