import { Inject, Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, authFlags } from '@azeebo/feature-flags';

import { DeviceLinkService } from './device-link.service.js';
import {
  InitiateDeviceLinkDto,
  PollDeviceLinkDto,
  ConfirmDeviceLinkDto,
  DenyDeviceLinkDto,
  DescribeDeviceLinkDto,
} from './dto/device-link.dto.js';
import { createSuccessResponse } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: { id: string };
  ip?: string;
}

/**
 * RFC 8628-style device authorization endpoints for TV sign-in.
 *
 *  - POST /auth/device/link        (public)  TV initiates; gets userCode + deviceCode
 *  - POST /auth/device/link/poll   (public)  TV polls with its deviceCode
 *  - POST /auth/device/link/info   (JWT)    phone/web asks which device is
 *                                            asking to be approved
 *  - POST /auth/device/link/confirm (JWT)    phone/web confirms the on-screen code
 *  - POST /auth/device/link/deny    (JWT)    phone/web rejects the on-screen code
 */
@ApiTags('Devices')
@Controller('auth/device/link')
export class DeviceLinkController {
  constructor(@Inject(DeviceLinkService) private readonly deviceLinkService: DeviceLinkService) {}

  @Post()
  @Public()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.deviceLink)
  @RateLimit(10, 60000) // 10 initiations per minute per IP
  @ApiOperation({ summary: 'Initiate TV device link (returns userCode + deviceCode)' })
  @ApiResponse({ status: 201, description: 'Codes created; poll until confirmed' })
  @ApiResponse({ status: 429, description: 'Rate limited or pending-code limit hit' })
  async initiate(@Body() dto: InitiateDeviceLinkDto) {
    const result = await this.deviceLinkService.initiate(dto);
    return createSuccessResponse(result);
  }

  @Post('poll')
  @Public()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.deviceLink)
  @RateLimit(30, 60000) // TV polls every ~5s; allow bursts
  @ApiOperation({ summary: 'Poll link status (deviceCode required; tokens returned exactly once)' })
  @ApiResponse({ status: 200, description: 'pending | confirmed (with tokens) | denied | expired' })
  async poll(@Body() dto: PollDeviceLinkDto) {
    const result = await this.deviceLinkService.poll(dto.deviceCode);
    return createSuccessResponse(result);
  }

  @Post('info')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.deviceLink)
  @RateLimit(20, 60000) // preview lookups while typing; generous but bounded
  @ApiOperation({
    summary: 'Describe the pending device for the approval screen (device name/type/expiry)',
  })
  @ApiResponse({ status: 200, description: 'Pending code details for the confirm UI' })
  @ApiResponse({ status: 401, description: 'Invalid/expired code' })
  async info(@Body() dto: DescribeDeviceLinkDto) {
    const result = await this.deviceLinkService.describe(dto.code);
    return createSuccessResponse(result);
  }

  @Post('confirm')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.deviceLink)
  @RateLimit(10, 60000) // 10 confirm attempts per minute (brute-force bound)
  @ApiOperation({ summary: 'Confirm the on-screen code for the signed-in user' })
  @ApiResponse({
    status: 200,
    description: 'Code confirmed; the TV will receive tokens on next poll',
  })
  @ApiResponse({ status: 401, description: 'Invalid/expired code' })
  async confirm(@Request() req: AuthRequest, @Body() dto: ConfirmDeviceLinkDto) {
    const result = await this.deviceLinkService.confirm(dto.code, req.user.id);
    return createSuccessResponse(result);
  }

  @Post('deny')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.deviceLink)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Reject the on-screen code' })
  @ApiResponse({ status: 200, description: 'Code denied; the TV will stop polling' })
  async deny(@Request() req: AuthRequest, @Body() dto: DenyDeviceLinkDto) {
    const result = await this.deviceLinkService.deny(dto.code, req.user.id);
    return createSuccessResponse(result);
  }
}
