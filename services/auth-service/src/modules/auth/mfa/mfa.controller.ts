import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { MfaService } from './mfa.service';
import { EnableMfaDto } from '../dto/enable-mfa.dto';
import { MfaResponse } from '../dto/mfa-response.interface';

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
  async setup(@Request() req: MfaRequest): Promise<MfaResponse> {
    const result = await this.mfaService.generateMfaSecret(req.user.id);

    return {
      success: true,
      data: {
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
        mfaEnabled: false,
      },
    };
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA verification result' })
  async verify(@Request() req: MfaRequest, @Body() dto: EnableMfaDto): Promise<MfaResponse> {
    const isValid = (await this.mfaService.verifyMfaCode(req.user.id, dto.code)) as boolean;

    return {
      success: isValid,
      data: {
        mfaEnabled: isValid,
      },
    };
  }

  @Post('enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  async enable(@Request() req: MfaRequest, @Body() dto: EnableMfaDto): Promise<MfaResponse> {
    const isValid = await this.mfaService.verifyMfaCode(req.user.id, dto.code);
    if (!isValid) {
      return {
        success: false,
        error: {
          code: 'MFA_INVALID_CODE',
          message: 'Invalid MFA code',
        },
      };
    }

    const setupResult = await this.mfaService.generateMfaSecret(req.user.id);
    await this.mfaService.enableMfa(req.user.id, setupResult.secret, setupResult.backupCodes);

    return {
      success: true,
      data: {
        mfaEnabled: true,
      },
    };
  }

  @Post('disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Disable MFA for user' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disable(@Request() req: MfaRequest): Promise<MfaResponse> {
    await this.mfaService.disableMfa(req.user.id);

    return {
      success: true,
      data: {
        mfaEnabled: false,
      },
    };
  }
}
