import { Module } from '@nestjs/common';
import { PublicController } from './public.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { ContentModule } from '../content/content.module.js';

@Module({
  imports: [DatabaseModule, ContentModule],
  controllers: [PublicController],
  providers: [],
  exports: [],
})
export class PublicModule {}
