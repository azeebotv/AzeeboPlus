import { Module } from '@nestjs/common';
import { SupportAdminController } from './support-admin.controller';
import { SupportAdminService } from './support-admin.service';

@Module({
  controllers: [SupportAdminController],
  providers: [SupportAdminService],
  exports: [SupportAdminService],
})
export class SupportAdminModule {}
