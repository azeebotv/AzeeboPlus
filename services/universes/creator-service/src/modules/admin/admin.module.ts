import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { CreatorsModule } from '../creators/creators.module.js';

@Module({
  imports: [CreatorsModule, JwtConfigModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
