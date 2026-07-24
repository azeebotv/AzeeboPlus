import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller.js';
import { DeviceLimitService } from './device-limit.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  controllers: [DeviceController],
  providers: [DeviceLimitService, PrismaService],
  exports: [DeviceLimitService],
})
export class DeviceModule {}
