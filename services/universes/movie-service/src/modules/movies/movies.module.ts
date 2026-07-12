import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@azeebo/shared-services';

import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService, DatabaseModule],
})
export class MoviesModule {}
