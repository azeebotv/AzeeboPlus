import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  imports: [JwtConfigModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
