import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
