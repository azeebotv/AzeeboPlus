import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminGuard } from '@azeebo/security';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
