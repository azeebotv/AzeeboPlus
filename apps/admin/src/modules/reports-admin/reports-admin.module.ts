import { Module } from '@nestjs/common';
import { ReportsAdminController } from './reports-admin.controller';
import { ReportsAdminService } from './reports-admin.service';

@Module({
  controllers: [ReportsAdminController],
  providers: [ReportsAdminService],
})
export class ReportsAdminModule {}
