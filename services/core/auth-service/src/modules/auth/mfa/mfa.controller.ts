import { Inject, Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@azeebo/security';

import { MfaService } from './mfa.service.js';
import { EnableMfaDto } from '../dto/enable-mfa.dto.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { FeatureFlag, FeatureFlagGuard, authFlags } from '@azeebo/feature-flags';

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
@FeatureFlag(authFlags.mfaTotp)
@UseGuards(FeatureFlagGuard, ServiceAuthGuard)
@Controller('mfa')
export class MfaController {
  constructor(@Inject(MfaService) private readonly mfaService: MfaService) {}

  @Get('setup')
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

    const hashedBackupCodes = await this.mfaService.getPendingBackupCodes(req.user.id);
    await this.mfaService.enableMfa(req.user.id, pendingSecret, hashedBackupCodes ?? undefined);
    await this.mfaService.clearPendingMfaSecret(req.user.id);

    return ApiResponseWrapper.success({ mfaEnabled: true });
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disable(@Request() req: MfaRequest, @Body() dto: EnableMfaDto): Promise<unknown> {
    const isValid = await this.mfaService.verifyMfaCode(req.user.id, dto.code);

    if (!isValid) {
      return ApiResponseWrapper.error(
        'MFA_INVALID_CODE',
        'Invalid TOTP code required to disable MFA'
      );
    }

    await this.mfaService.disableMfa(req.user.id);

    return ApiResponseWrapper.success({ mfaEnabled: false });
  }
}
