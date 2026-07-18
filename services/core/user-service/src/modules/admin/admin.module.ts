import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { AdminGuard } from '@azeebo/security';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    JwtConfigModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
