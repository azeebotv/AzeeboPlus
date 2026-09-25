import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TaskRouterService } from './task-router.service';
import { TaskRouterController } from './task-router.controller';

@Module({
  imports: [DatabaseModule],
  providers: [TaskRouterService],
  controllers: [TaskRouterController],
  exports: [TaskRouterService],
})
export class TaskRouterModule {}
