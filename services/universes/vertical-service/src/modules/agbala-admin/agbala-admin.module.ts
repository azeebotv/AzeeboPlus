import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AgbalaAdminController } from './agbala-admin.controller';
import { AgbalaAdminService } from './agbala-admin.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [JwtConfigModule],
  controllers: [AgbalaAdminController],
  providers: [AgbalaAdminService, PrismaService],
})
export class AgbalaAdminModule {}
