import { Module } from '@nestjs/common';
import { SuspensionController } from './suspension.controller';
import { SuspensionService } from './suspension.service';

@Module({
  controllers: [SuspensionController],
  providers: [SuspensionService],
  exports: [SuspensionService],
})
export class SuspensionModule {}
