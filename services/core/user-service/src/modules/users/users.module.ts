import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@azeebo/shared-services';

import { UsersController } from './users.controller.js';
import { InteractionsController } from './interactions.controller.js';
import { UsersService } from './users.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { UserDeletionController } from '../user/user-deletion.controller.js';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    CacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || '',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController, InteractionsController, UserDeletionController],
  providers: [UsersService],
  exports: [UsersService, DatabaseModule],
})
export class UsersModule {}
