import { Module } from '@nestjs/common';
import { BundleController } from './bundle.controller.js';
import { BundleService } from './bundle.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [BundleController],
  providers: [BundleService],
  exports: [BundleService],
})
export class BundleModule {}
