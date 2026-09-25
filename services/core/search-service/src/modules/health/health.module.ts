import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { SearchModule } from '../search/search.module.js';

@Module({
  imports: [DatabaseModule, SearchModule],
  controllers: [HealthController],
})
export class HealthModule {}
