import { Module } from '@nestjs/common';
import { RedisModule, JwtConfigModule } from '@azeebo/shared-services';

import { MoviesController } from './movies.controller.js';
import { DboController } from './dbo.controller.js';
import { MoviesService } from './movies.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, RedisModule, JwtConfigModule],
  controllers: [MoviesController, DboController],
  providers: [MoviesService],
  exports: [MoviesService, DatabaseModule],
})
export class MoviesModule {}
