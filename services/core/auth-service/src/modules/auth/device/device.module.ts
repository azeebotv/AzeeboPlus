import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller.js';
import { DeviceService } from './device.service.js';
import { DatabaseModule } from '../../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
