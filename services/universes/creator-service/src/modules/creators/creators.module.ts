import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimiterModule } from '@azeebo/security';

import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { DatabaseModule } from '../database/database.module';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    RateLimiterModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<any> => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CreatorsController],
  providers: [CreatorsService, JwtStrategy],
  exports: [CreatorsService, DatabaseModule],
})
export class CreatorsModule {}
