import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit, ServiceAuthGuard } from '@azeebo/security';

import { ReferralService } from './referral.service';
import { GenerateReferralCodeDto, ApplyReferralCodeDto, GetReferralsDto } from './dto/referral.dto';
import { ReferralResponse } from './interfaces/referral-response.interface';

@ApiTags('Referrals')
@UseGuards(RateLimitGuard)
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('code')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user referral code' })
  @ApiResponse({ status: 200, description: 'Referral code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReferralCode(@Request() req: { user: { sub: string } }): Promise<ReferralResponse> {
    return this.referralService.getReferralCode(req.user.sub);
  }

  @Post('generate')
  @RateLimit(10, 3600000)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new referral code' })
  @ApiResponse({ status: 201, description: 'Referral code generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateReferralCode(
    @Request() req: { user: { sub: string } },
    @Body() generateDto: GenerateReferralCodeDto
  ): Promise<ReferralResponse> {
    return this.referralService.generateReferralCode(req.user.sub, generateDto);
  }

  @Post('apply')
  @RateLimit(10, 3600000)
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a referral code' })
  @ApiResponse({ status: 200, description: 'Referral code applied' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Already used a referral code' })
  async applyReferralCode(
    @Request() req: { user: { sub: string } },
    @Body() applyDto: ApplyReferralCodeDto
  ): Promise<ReferralResponse> {
    return this.referralService.applyReferralCode(req.user.sub, applyDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user referrals' })
  @ApiResponse({ status: 200, description: 'User referrals' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReferrals(
    @Request() req: { user: { sub: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<ReferralResponse> {
    return this.referralService.getReferrals(req.user.sub, Number(page) || 1, Number(limit) || 20);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get referral statistics' })
  @ApiResponse({ status: 200, description: 'Referral statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@Request() req: { user: { sub: string } }): Promise<ReferralResponse> {
    return this.referralService.getStats(req.user.sub);
  }

  @Post('complete/:referralId')
  @RateLimit(10, 3600000)
  @UseGuards(AuthGuard('jwt'), ServiceAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a referral' })
  @ApiResponse({ status: 200, description: 'Referral completed' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async completeReferral(
    @Request() req: { user: { sub: string } },
    @Param('referralId') referralId: string
  ): Promise<ReferralResponse> {
    return this.referralService.completeReferral(referralId, req.user.sub);
  }
}
