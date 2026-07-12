import { Module } from '@nestjs/common';
import { FixturesController } from './fixtures.controller.js';
import { FixturesService } from './fixtures.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [FixturesController],
  providers: [FixturesService],
  exports: [FixturesService],
})
export class FixturesModule {}
