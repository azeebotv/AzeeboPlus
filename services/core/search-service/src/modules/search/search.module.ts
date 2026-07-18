import { Module } from '@nestjs/common';
import { CacheModule, JwtConfigModule } from '@azeebo/shared-services';

import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { SearchRepository } from './search.repository.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    JwtConfigModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
  exports: [SearchService, SearchRepository, DatabaseModule],
})
export class SearchModule {}
