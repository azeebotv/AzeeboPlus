import { Module } from '@nestjs/common';
import { UniverseManagementService } from './universe-management.service';
import { UniverseManagementController } from './universe-management.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UniverseManagementController],
  providers: [UniverseManagementService],
  exports: [UniverseManagementService],
})
export class UniverseManagementModule {}
