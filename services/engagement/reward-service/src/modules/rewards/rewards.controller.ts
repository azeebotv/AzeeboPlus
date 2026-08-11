import {
  Inject,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, rewardFlags } from '@azeebo/feature-flags';

import { RewardsService } from './rewards.service.js';
import { RedeemRewardDto } from './dto/redeem-reward.dto.js';
import { RewardResponse } from './interfaces/reward-response.interface.js';

@ApiTags('Rewards')
@UseGuards(RateLimitGuard, ServiceAuthGuard)
@UseGuards(FeatureFlagGuard)
@FeatureFlag(rewardFlags.pointsEnabled)
@Controller('rewards')
export class RewardsController {
  constructor(@Inject(RewardsService) private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get reward account overview' })
  @ApiResponse({ status: 200, description: 'Reward account' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRewardAccount(@Request() req: { user: { id: string } }): Promise<RewardResponse> {
    return this.rewardsService.getRewardAccount(req.user.id);
  }

  @Get('missions')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(rewardFlags.missions)
  @ApiOperation({ summary: 'List active missions' })
  @ApiResponse({ status: 200, description: 'Active missions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMissions(@Request() req: { user: { id: string } }): Promise<RewardResponse> {
    return this.rewardsService.getMissions(req.user.id);
  }

  @Get('badges')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(rewardFlags.badges)
  @ApiOperation({ summary: 'List badges' })
  @ApiResponse({ status: 200, description: 'User badges' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBadges(@Request() req: { user: { id: string } }): Promise<RewardResponse> {
    return this.rewardsService.getBadges(req.user.id);
  }

  @Get('streak')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(rewardFlags.streaks)
  @ApiOperation({ summary: 'Get current streak' })
  @ApiResponse({ status: 200, description: 'Streak info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStreak(@Request() req: { user: { id: string } }): Promise<RewardResponse> {
    return this.rewardsService.getStreak(req.user.id);
  }

  @Post('redeem')
  @RateLimit(30, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem reward' })
  @ApiResponse({ status: 200, description: 'Reward redeemed' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async redeemReward(
    @Request() req: { user: { id: string } },
    @Body() redeemRewardDto: RedeemRewardDto
  ): Promise<RewardResponse> {
    return this.rewardsService.redeemReward(req.user.id, redeemRewardDto.rewardId);
  }

  @Get('level')
  @ApiOperation({ summary: 'Get user level' })
  @ApiResponse({ status: 200, description: 'User level' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLevel(@Request() req: { user: { id: string } }): Promise<RewardResponse> {
    return this.rewardsService.getLevel(req.user.id);
  }

  @Post('earn')
  @RateLimit(30, 60000)
  @UseGuards(ServiceAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Earn points for activity' })
  @ApiResponse({ status: 200, description: 'Points earned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async earnPoints(
    @Request() req: { user: { id: string } },
    @Body() body: { activity: string }
  ): Promise<RewardResponse> {
    return this.rewardsService.earnPoints(req.user.id, body.activity);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get points balance' })
  @ApiResponse({ status: 200, description: 'Points balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Request() req: { user: { id: string } }): Promise<RewardResponse> {
    return this.rewardsService.getBalance(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get reward history' })
  @ApiResponse({ status: 200, description: 'Reward history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Request() req: { user: { id: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<RewardResponse> {
    return this.rewardsService.getHistory(req.user.id, Number(page) || 1, Number(limit) || 20);
  }
}
