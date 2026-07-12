import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { MfaService } from './mfa.service.js';
import { EnableMfaDto } from '../dto/enable-mfa.dto.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

interface MfaRequest {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatar: string | null;
    role: string;
  };
}

@ApiTags('MFA')
@Controller('mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Setup MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA setup information' })
  async setup(@Request() req: MfaRequest): Promise<unknown> {
    const result = await this.mfaService.generateMfaSecret(req.user.id);

    return ApiResponseWrapper.success({
      secret: result.secret,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes,
      mfaEnabled: false,
    });
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA verification result' })
  async verify(@Request() req: MfaRequest, @Body() dto: EnableMfaDto): Promise<unknown> {
    const isValid = (await this.mfaService.verifyMfaCode(req.user.id, dto.code)) as boolean;

    if (isValid) {
      return ApiResponseWrapper.success({ mfaEnabled: true });
    }
    return ApiResponseWrapper.error('MFA_INVALID_CODE', 'Invalid MFA code');
  }

  @Post('enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  async enable(@Request() req: MfaRequest, @Body() dto: EnableMfaDto): Promise<unknown> {
    const pendingSecret = await this.mfaService.getPendingMfaSecret(req.user.id);
    if (!pendingSecret) {
      return ApiResponseWrapper.error('MFA_SETUP_REQUIRED', 'Run /mfa/setup first');
    }

    const isValid = await this.mfaService.verifyMfaCode(req.user.id, dto.code);

    if (!isValid) {
      return ApiResponseWrapper.error('MFA_INVALID_CODE', 'Invalid MFA code');
    }

    await this.mfaService.enableMfa(req.user.id, pendingSecret);
    await this.mfaService.clearPendingMfaSecret(req.user.id);

    return ApiResponseWrapper.success({ mfaEnabled: true });
  }

  @Post('disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Disable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disable(@Request() req: MfaRequest): Promise<unknown> {
    await this.mfaService.disableMfa(req.user.id);

    return ApiResponseWrapper.success({ mfaEnabled: false });
  }
}
