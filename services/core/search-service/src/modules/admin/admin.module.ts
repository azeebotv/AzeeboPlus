import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { SearchModule } from '../search/search.module.js';
import { RepairModule } from '../repair/repair.module.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule, SearchModule, RepairModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
