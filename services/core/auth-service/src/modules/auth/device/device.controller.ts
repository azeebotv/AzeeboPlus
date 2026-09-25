import {
  Inject,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { DeviceService } from './device.service.js';
import { UpdateDeviceInfoDto } from '../dto/device.dto.js';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, authFlags } from '@azeebo/feature-flags';
import { User, ApiResponseWrapper } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: User;
}

export interface DeviceInfo {
  id: string;
  deviceName: string;
  deviceType: string;
  os: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrentDevice: boolean;
}

@ApiTags('Devices')
@ApiBearerAuth()
@FeatureFlag(authFlags.deviceLimits)
@Controller('auth/devices')
@UseGuards(FeatureFlagGuard, RateLimitGuard)
export class DeviceController {
  constructor(@Inject(DeviceService) private readonly deviceService: DeviceService) {}

  @Get()
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Get all active devices for current user' })
  @ApiResponse({ status: 200, description: 'List of active devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDevices(@Request() req: AuthRequest): Promise<unknown> {
    const devices = await this.deviceService.getUserDevices(req.user.id);
    return ApiResponseWrapper.success(devices);
  }

  @Delete(':deviceId')
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Revoke a device session' })
  @ApiResponse({ status: 200, description: 'Device revoked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeDevice(
    @Request() req: AuthRequest,
    @Param('deviceId') deviceId: string
  ): Promise<unknown> {
    await this.deviceService.revokeDevice(req.user.id, deviceId);
    return ApiResponseWrapper.success({ message: 'Device session revoked' });
  }

  @Patch(':deviceId')
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Update device name' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async updateDevice(
    @Request() req: AuthRequest,
    @Param('deviceId') deviceId: string,
    @Body() updateDto: UpdateDeviceInfoDto
  ): Promise<unknown> {
    const device = await this.deviceService.updateDevice(req.user.id, deviceId, updateDto);
    return ApiResponseWrapper.success(device);
  }

  @Post('revoke-all')
  @RateLimit(2, 3600000)
  @ApiOperation({ summary: 'Revoke all other device sessions' })
  @ApiResponse({ status: 200, description: 'All other devices revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeAllOtherDevices(@Request() req: AuthRequest): Promise<unknown> {
    await this.deviceService.revokeAllOtherDevices(req.user.id);
    return ApiResponseWrapper.success({ message: 'All other device sessions revoked' });
  }
}
