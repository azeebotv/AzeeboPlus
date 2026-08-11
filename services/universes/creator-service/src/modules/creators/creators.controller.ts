import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, Public, ServiceAuthGuard } from '@azeebo/security';
import { FeatureFlagGuard, FeatureFlag, creatorFlags } from '@azeebo/feature-flags';

import { CreatorsService } from './creators.service.js';
import { CreatorResponse } from './interfaces/creator-response.interface.js';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import {
  SubmitDocumentsDto,
  UploadRequestDto,
  LinkUploadDto,
  FundCreatorDto,
  UpdateTierDto,
  PublishContentDto,
  UpdateCreatorSettingsDto,
} from './dto/creator.dto.js';

interface UpdateProfileBody {
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  socialLinks?: Record<string, string>;
}

interface CreateUploadBody {
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
}

interface ChannelBody {
  name: string;
  description?: string;
  category?: string;
}

interface ChallengeBody {
  title: string;
  description: string;
  prize: string;
  startDate: Date;
  endDate: Date;
}

interface PayoutBody {
  amount: number;
  method: string;
  accountDetails: Record<string, string>;
}

@ApiTags('Creators')
@ApiBearerAuth()
@UseGuards(ServiceAuthGuard)
@Controller('creators')
export class CreatorsController {
  constructor(@Inject(CreatorsService) private readonly creatorsService: CreatorsService) {}

  @Post('onboard')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Creator onboarding' })
  @ApiResponse({ status: 201, description: 'Creator profile created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async onboard(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.onboard(req.user.id);
  }

  @Post('verification/submit')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Submit verification documents' })
  @ApiResponse({ status: 201, description: 'Verification submitted' })
  async submitVerification(
    @Request() req: { user: { id: string } },
    @Body() body: SubmitDocumentsDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.submitVerification(req.user.id, body.documents);
  }

  @Get('verification/status')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get verification status' })
  @ApiResponse({ status: 200, description: 'Verification status' })
  async getVerificationStatus(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getVerificationStatus(req.user.id);
  }

  @Post('upload/initiate')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Initiate media upload' })
  @ApiResponse({ status: 201, description: 'Upload initiated' })
  async uploadMedia(
    @Request() req: { user: { id: string } },
    @Body() body: UploadRequestDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.uploadMedia(req.user.id, body);
  }

  @Post('upload/complete')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Complete media upload' })
  @ApiResponse({ status: 201, description: 'Upload completed' })
  async completeUpload(
    @Request() req: { user: { id: string } },
    @Body() body: LinkUploadDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.completeUpload(req.user.id, body.uploadId, body.assetId);
  }

  @Get('me')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get creator profile' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMyProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Update creator profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateProfileBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.updateProfile(req.user.id, body);
  }

  @Get('channels')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'List my channels' })
  @ApiResponse({ status: 200, description: 'Channels list' })
  async listChannels(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.listChannels(req.user.id);
  }

  @Post('channels')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create channel' })
  @ApiResponse({ status: 201, description: 'Channel created' })
  async createChannel(
    @Request() req: { user: { id: string } },
    @Body() body: ChannelBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createChannel(req.user.id, body);
  }

  @Public()
  @Get('channels/:channelId')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get channel details' })
  @ApiResponse({ status: 200, description: 'Channel details' })
  async getChannel(@Param('channelId') channelId: string): Promise<CreatorResponse> {
    return this.creatorsService.getChannel(channelId);
  }

  @Public()
  @Get('discover')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Creator discovery' })
  @ApiResponse({ status: 200, description: 'Discover creators' })
  async discover(): Promise<CreatorResponse> {
    return this.creatorsService.discover();
  }

  @Get('uploads')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'List own uploads' })
  @ApiResponse({ status: 200, description: 'Uploads list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listUploads(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.listUploads(req.user.id);
  }

  @Get('subscriptions')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get my subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions list' })
  async getMySubscriptions(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMySubscriptions(req.user.id);
  }

  @Get('subscribers')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get my subscribers' })
  @ApiResponse({ status: 200, description: 'Subscribers list' })
  async getMySubscribers(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMySubscribers(req.user.id);
  }

  @Get('earnings')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get creator earnings' })
  @ApiResponse({ status: 200, description: 'Earnings data' })
  async getEarnings(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getEarnings(req.user.id);
  }

  @Get('payouts')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({ status: 200, description: 'Payout history' })
  async getPayoutHistory(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getPayoutHistory(req.user.id);
  }

  @Get('analytics')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(creatorFlags.monetizationInsights)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get creator analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getAnalytics(req.user.id);
  }

  @Get('challenges')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get creator challenges' })
  @ApiResponse({ status: 200, description: 'Challenges list' })
  async getChallenges(@Query('creatorId') creatorId?: string): Promise<CreatorResponse> {
    return this.creatorsService.getChallenges(creatorId);
  }

  @Get('stats')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get creator stats' })
  async getStats(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getStats(req.user.id);
  }

  @Get('settings')
  @UseGuards(RolesGuard, RateLimitGuard)
  @RateLimit(10, 60000)
  @Roles('creator')
  @ApiOperation({ summary: 'Get creator notification and privacy settings' })
  @ApiResponse({ status: 200, description: 'Creator settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getSettings(req.user.id);
  }

  // Wildcard GET routes MUST come after all static GET routes
  @Public()
  @Get(':creatorId')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get creator public profile' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  async getProfile(@Param('creatorId') creatorId: string): Promise<CreatorResponse> {
    return this.creatorsService.getProfile(creatorId);
  }

  @Post('uploads')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create upload' })
  @ApiResponse({ status: 201, description: 'Upload created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUpload(
    @Request() req: { user: { id: string } },
    @Body() body: CreateUploadBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createUpload(req.user.id, body);
  }

  @Post('channels/:channelId/uploads')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create upload for channel' })
  @ApiResponse({ status: 201, description: 'Upload created' })
  async createChannelUpload(
    @Request() req: { user: { id: string } },
    @Param('channelId') channelId: string,
    @Body() body: CreateUploadBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createUploadForChannel(req.user.id, channelId, body);
  }

  @Post('tips/:creatorId')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(creatorFlags.tipsEnabled)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Send tip to creator' })
  @ApiResponse({ status: 201, description: 'Tip sent' })
  async sendTip(
    @Request() req: { user: { id: string } },
    @Param('creatorId') creatorId: string,
    @Body() body: FundCreatorDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.sendTip(req.user.id, creatorId, body.amount, body.message);
  }

  @Get('tips/leaderboard/:creatorId')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get tip leaderboard for a creator' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getTipLeaderboard(
    @Param('creatorId') creatorId: string,
    @Query('period') period?: string
  ): Promise<CreatorResponse> {
    return this.creatorsService.getTipLeaderboard(creatorId, period || 'all');
  }

  @Get('tips/stats/:creatorId')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get tip statistics for a creator' })
  @ApiResponse({ status: 200, description: 'Tip stats' })
  async getTipStats(@Param('creatorId') creatorId: string): Promise<CreatorResponse> {
    return this.creatorsService.getTipStats(creatorId);
  }

  @Get('users/me/tips')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get current user tipping history' })
  @ApiResponse({ status: 200, description: 'User tips' })
  async getMyTips(@Request() req: { user: { id: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMyTips(req.user.id);
  }

  @Post('subscribe/:creatorId')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(creatorFlags.subscriptionsEnabled)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Subscribe to creator' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  async subscribe(
    @Request() req: { user: { id: string } },
    @Param('creatorId') creatorId: string,
    @Body() body: UpdateTierDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.subscribe(req.user.id, creatorId, body.tier || 'free');
  }

  @Delete('subscribe/:creatorId')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(creatorFlags.subscriptionsEnabled)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @Request() req: { user: { id: string } },
    @Param('creatorId') creatorId: string
  ): Promise<CreatorResponse> {
    return this.creatorsService.cancelSubscription(req.user.id, creatorId);
  }

  @Post('payouts')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(creatorFlags.payoutsEnabled)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({ status: 201, description: 'Payout requested' })
  async requestPayout(
    @Request() req: { user: { id: string } },
    @Body() body: PayoutBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.requestPayout(req.user.id, body);
  }

  @Post('challenges')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create creator challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  async createChallenge(
    @Request() req: { user: { id: string } },
    @Body() body: ChallengeBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createChallenge(req.user.id, body);
  }

  @Post('challenges/:challengeId/participate')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Participate in challenge' })
  @ApiResponse({ status: 201, description: 'Participated' })
  async participateInChallenge(
    @Request() req: { user: { id: string } },
    @Param('challengeId') challengeId: string,
    @Body() body: PublishContentDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.participateInChallenge(req.user.id, challengeId, body.contentUrl);
  }

  @Put('settings')
  @UseGuards(RolesGuard, RateLimitGuard)
  @RateLimit(10, 60000)
  @Roles('creator')
  @ApiOperation({ summary: 'Update creator notification and privacy settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSettings(
    @Request() req: { user: { id: string } },
    @Body() body: UpdateCreatorSettingsDto
  ): Promise<CreatorResponse> {
    return this.creatorsService.updateSettings(req.user.id, body);
  }

  @Put('monetization/settings')
  @UseGuards(RolesGuard, RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Update monetization settings' })
  async updateMonetizationSettings(
    @Request() req: { user: { id: string } },
    @Body() body: Record<string, unknown>
  ): Promise<CreatorResponse> {
    return this.creatorsService.updateSettings(req.user.id, body);
  }

  @Public()
  @Get(':creatorId/content')
  @ApiOperation({ summary: "Get creator's content" })
  async getCreatorContent(
    @Param('creatorId') creatorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<CreatorResponse> {
    return this.creatorsService.getCreatorContent(creatorId, Number(page), Number(limit));
  }
}
