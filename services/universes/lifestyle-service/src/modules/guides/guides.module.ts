import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { GuidesController } from './guides.controller';
import { GuidesService } from './guides.service';
import { GuidesAdminController } from './guides-admin.controller';
import { GuidesAdminService } from './guides-admin.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [GuidesController, GuidesAdminController],
  providers: [GuidesService, GuidesAdminService],
  exports: [GuidesService, GuidesAdminService],
})
export class GuidesModule {}
