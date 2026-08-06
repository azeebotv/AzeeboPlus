import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RateLimiterModule } from '@azeebo/security';
import { CacheModule, JwtConfigModule, JwtStrategy } from '@azeebo/shared-services';

import { CreatorsController } from './creators.controller.js';
import { CreatorsService } from './creators.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, PassportModule, RateLimiterModule, CacheModule, JwtConfigModule],
  controllers: [CreatorsController],
  providers: [CreatorsService, JwtStrategy],
  exports: [CreatorsService, DatabaseModule],
})
export class CreatorsModule {}
