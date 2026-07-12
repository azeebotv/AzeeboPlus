import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@azeebo/shared-services';
import type { StringValue } from 'ms';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { FirebaseModule } from '../firebase/firebase.module.js';
import { EmailModule } from '../email/email.module.js';
import { SmsModule } from '../sms/sms.module.js';

@Module({
  imports: [
    DatabaseModule,
    FirebaseModule,
    EmailModule,
    SmsModule,
    PassportModule,
    CacheModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') ?? '',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, DatabaseModule],
})
export class NotificationsModule {}
