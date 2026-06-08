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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { RewardsService } from './rewards.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { RewardResponse } from './interfaces/reward-response.interface';

@ApiTags('Rewards')
@Controller('v1/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get reward account overview' })
  @ApiResponse({ status: 200, description: 'Reward account' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRewardAccount(@Request() req: { user: { sub: string } }): Promise<RewardResponse> {
    return this.rewardsService.getRewardAccount(req.user.sub);
  }

  @Get('missions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List active missions' })
  @ApiResponse({ status: 200, description: 'Active missions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMissions(@Request() req: { user: { sub: string } }): Promise<RewardResponse> {
    return this.rewardsService.getMissions(req.user.sub);
  }

  @Get('badges')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List badges' })
  @ApiResponse({ status: 200, description: 'User badges' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBadges(@Request() req: { user: { sub: string } }): Promise<RewardResponse> {
    return this.rewardsService.getBadges(req.user.sub);
  }

  @Get('streak')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current streak' })
  @ApiResponse({ status: 200, description: 'Streak info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStreak(@Request() req: { user: { sub: string } }): Promise<RewardResponse> {
    return this.rewardsService.getStreak(req.user.sub);
  }

  @Post('redeem')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem reward' })
  @ApiResponse({ status: 200, description: 'Reward redeemed' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async redeemReward(
    @Request() req: { user: { sub: string } },
    @Body() redeemRewardDto: RedeemRewardDto
  ): Promise<RewardResponse> {
    return this.rewardsService.redeemReward(req.user.sub, redeemRewardDto.rewardId);
  }

  @Get('level')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user level' })
  @ApiResponse({ status: 200, description: 'User level' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLevel(@Request() req: { user: { sub: string } }): Promise<RewardResponse> {
    return this.rewardsService.getLevel(req.user.sub);
  }

  @Post('earn')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Earn points for activity' })
  @ApiResponse({ status: 200, description: 'Points earned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async earnPoints(
    @Request() req: { user: { sub: string } },
    @Body() body: { activity: string; amount?: number }
  ): Promise<RewardResponse> {
    return this.rewardsService.earnPoints(req.user.sub, body.activity, body.amount);
  }

  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get points balance' })
  @ApiResponse({ status: 200, description: 'Points balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Request() req: { user: { sub: string } }): Promise<RewardResponse> {
    return this.rewardsService.getBalance(req.user.sub);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get reward history' })
  @ApiResponse({ status: 200, description: 'Reward history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Request() req: { user: { sub: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<RewardResponse> {
    return this.rewardsService.getHistory(req.user.sub, Number(page) || 1, Number(limit) || 20);
  }
}
