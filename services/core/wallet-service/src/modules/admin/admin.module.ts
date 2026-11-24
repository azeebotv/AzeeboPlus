import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { DatabaseModule } from '../database/database.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

/**
 * Admin-only wallet inspection routes (/admin/...), guarded by AdminGuard
 * (requires an admin-role JWT). JwtConfigModule is @Global() but imported
 * explicitly here (reward-service's AdminModule pattern) so the JwtService
 * AdminGuard needs is unambiguously resolvable. DatabaseModule provides the
 * PrismaService that AdminService injects.
 */
@Module({
  imports: [JwtConfigModule, DatabaseModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
