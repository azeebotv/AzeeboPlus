import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CreatorsService } from './creators.service';
import { CreatorResponse } from './interfaces/creator-response.interface';

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
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post('onboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Creator onboarding' })
  @ApiResponse({ status: 201, description: 'Creator profile created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async onboard(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.onboard(req.user.sub);
  }

  @Post('verification/submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit verification documents' })
  @ApiResponse({ status: 201, description: 'Verification submitted' })
  async submitVerification(
    @Request() req: { user: { sub: string } },
    @Body() body: { documents: { type: string; url: string }[] }
  ): Promise<CreatorResponse> {
    return this.creatorsService.submitVerification(req.user.sub, body.documents);
  }

  @Get('verification/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get verification status' })
  @ApiResponse({ status: 200, description: 'Verification status' })
  async getVerificationStatus(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getVerificationStatus(req.user.sub);
  }

  @Post('upload/initiate')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Initiate media upload' })
  @ApiResponse({ status: 201, description: 'Upload initiated' })
  async uploadMedia(
    @Request() req: { user: { sub: string } },
    @Body() body: { fileName: string; mimeType: string; size: number }
  ): Promise<CreatorResponse> {
    return this.creatorsService.uploadMedia(req.user.sub, body);
  }

  @Post('upload/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Complete media upload' })
  @ApiResponse({ status: 201, description: 'Upload completed' })
  async completeUpload(
    @Request() req: { user: { sub: string } },
    @Body() body: { uploadId: string; assetId: string }
  ): Promise<CreatorResponse> {
    return this.creatorsService.completeUpload(req.user.sub, body.uploadId, body.assetId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get creator profile' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMyProfile(req.user.sub);
  }

  @Get(':creatorId')
  @ApiOperation({ summary: 'Get creator public profile' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  async getProfile(@Param('creatorId') creatorId: string): Promise<CreatorResponse> {
    return this.creatorsService.getProfile(creatorId);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update creator profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() body: UpdateProfileBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.updateProfile(req.user.sub, body);
  }

  @Post('channels')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create channel' })
  @ApiResponse({ status: 201, description: 'Channel created' })
  async createChannel(
    @Request() req: { user: { sub: string } },
    @Body() body: ChannelBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createChannel(req.user.sub, body);
  }

  @Get('channels')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List my channels' })
  @ApiResponse({ status: 200, description: 'Channels list' })
  async listChannels(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.listChannels(req.user.sub);
  }

  @Get('channels/:channelId')
  @ApiOperation({ summary: 'Get channel details' })
  @ApiResponse({ status: 200, description: 'Channel details' })
  async getChannel(@Param('channelId') channelId: string): Promise<CreatorResponse> {
    return this.creatorsService.getChannel(channelId);
  }

  @Post('uploads')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create upload' })
  @ApiResponse({ status: 201, description: 'Upload created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUpload(
    @Request() req: { user: { sub: string } },
    @Body() body: CreateUploadBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createUpload(req.user.sub, body);
  }

  @Post('channels/:channelId/uploads')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create upload for channel' })
  @ApiResponse({ status: 201, description: 'Upload created' })
  async createChannelUpload(
    @Request() req: { user: { sub: string } },
    @Param('channelId') channelId: string,
    @Body() body: CreateUploadBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createUploadForChannel(req.user.sub, channelId, body);
  }

  @Get('uploads')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List own uploads' })
  @ApiResponse({ status: 200, description: 'Uploads list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listUploads(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.listUploads(req.user.sub);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Creator discovery' })
  @ApiResponse({ status: 200, description: 'Discover creators' })
  async discover(): Promise<CreatorResponse> {
    return this.creatorsService.discover();
  }

  @Post('tips/:creatorId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Send tip to creator' })
  @ApiResponse({ status: 201, description: 'Tip sent' })
  async sendTip(
    @Request() req: { user: { sub: string } },
    @Param('creatorId') creatorId: string,
    @Body() body: { amount: number }
  ): Promise<CreatorResponse> {
    return this.creatorsService.sendTip(req.user.sub, creatorId, body.amount);
  }

  @Post('subscribe/:creatorId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Subscribe to creator' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  async subscribe(
    @Request() req: { user: { sub: string } },
    @Param('creatorId') creatorId: string,
    @Body() body: { tier?: string }
  ): Promise<CreatorResponse> {
    return this.creatorsService.subscribe(req.user.sub, creatorId, body.tier || 'free');
  }

  @Delete('subscribe/:creatorId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @Request() req: { user: { sub: string } },
    @Param('creatorId') creatorId: string
  ): Promise<CreatorResponse> {
    return this.creatorsService.cancelSubscription(req.user.sub, creatorId);
  }

  @Get('subscriptions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get my subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions list' })
  async getMySubscriptions(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMySubscriptions(req.user.sub);
  }

  @Get('subscribers')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get my subscribers' })
  @ApiResponse({ status: 200, description: 'Subscribers list' })
  async getMySubscribers(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMySubscribers(req.user.sub);
  }

  @Get('earnings')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get creator earnings' })
  @ApiResponse({ status: 200, description: 'Earnings data' })
  async getEarnings(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getEarnings(req.user.sub);
  }

  @Post('payouts')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({ status: 201, description: 'Payout requested' })
  async requestPayout(
    @Request() req: { user: { sub: string } },
    @Body() body: PayoutBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.requestPayout(req.user.sub, body);
  }

  @Get('payouts')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({ status: 200, description: 'Payout history' })
  async getPayoutHistory(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getPayoutHistory(req.user.sub);
  }

  @Get('analytics')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get creator analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getAnalytics(req.user.sub);
  }

  @Post('challenges')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create creator challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  async createChallenge(
    @Request() req: { user: { sub: string } },
    @Body() body: ChallengeBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createChallenge(req.user.sub, body);
  }

  @Get('challenges')
  @ApiOperation({ summary: 'Get creator challenges' })
  @ApiResponse({ status: 200, description: 'Challenges list' })
  async getChallenges(@Param('creatorId') creatorId?: string): Promise<CreatorResponse> {
    return this.creatorsService.getChallenges(creatorId);
  }

  @Post('challenges/:challengeId/participate')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Participate in challenge' })
  @ApiResponse({ status: 201, description: 'Participated' })
  async participateInChallenge(
    @Request() req: { user: { sub: string } },
    @Param('challengeId') challengeId: string,
    @Body() body: { contentUrl: string }
  ): Promise<CreatorResponse> {
    return this.creatorsService.participateInChallenge(req.user.sub, challengeId, body.contentUrl);
  }
}
