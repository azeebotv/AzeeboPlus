import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<Record<string, unknown>> => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m') as string | number,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PollController],
  providers: [PollService],
  exports: [PollService],
})
export class PollModule {}
