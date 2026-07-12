import { Module } from '@nestjs/common';
import { PublicController } from './public.controller.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicController],
  providers: [],
  exports: [],
})
export class PublicModule {}
