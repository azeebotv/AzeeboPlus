import { Inject, Controller, Get, Post, Delete, Param, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceLimitService, DeviceCheckResult } from './device-limit.service.js';

interface AuthRequest extends Request {
  user: { id: string };
}

@ApiTags('Devices')
@Controller('auth/devices')
export class DeviceController {
  constructor(
    @Inject(DeviceLimitService) private readonly deviceLimitService: DeviceLimitService
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List registered devices' })
  @ApiResponse({ status: 200, description: 'List of devices' })
  async getDevices(@Request() req: AuthRequest) {
    const devices = await this.deviceLimitService.getDevices(req.user.id);
    return { success: true, data: devices };
  }

  @Get('check')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check device limit' })
  @ApiResponse({ status: 200, description: 'Device limit check result' })
  async checkDeviceLimit(@Request() req: AuthRequest): Promise<DeviceCheckResult> {
    return this.deviceLimitService.checkDeviceLimit(req.user.id);
  }

  @Post('register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a device' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  async registerDevice(
    @Request() req: AuthRequest,
    @Body()
    body: {
      deviceName: string;
      deviceType: string;
      os?: string;
      browser?: string;
      fingerprint?: string;
    }
  ) {
    const device = await this.deviceLimitService.registerDevice(req.user.id, body);
    return { success: true, data: device };
  }

  @Delete(':deviceId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a device' })
  @ApiResponse({ status: 200, description: 'Device revoked' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeDevice(@Request() req: AuthRequest, @Param('deviceId') deviceId: string) {
    return this.deviceLimitService.revokeDevice(req.user.id, deviceId);
  }
}
