import {
  Inject,
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatorService, ContentItem } from './creator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ArchivedContentSweeperService } from './archived-content-sweeper.service';
import { FeatureFlagService, creatorFlags } from '@azeebo/feature-flags';
import { UNIVERSE_SLUGS, universeEnabledKey } from '@azeebo/shared-types';
import {
  ListContentQueryDto,
  CreateContentDto,
  UpdateContentDto,
  RequestPayoutDto,
  UpdatePayoutSettingsDto,
  UpdateSettingsDto,
  CreateSubscriptionTierDto,
  UpdateSubscriptionTierDto,
  SubmitChallengeDto,
  UpdateProfileDto,
  UpdateMonetizationSettingsDto,
} from './dto';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('creator', 'admin', 'superadmin')
@Controller('creator')
export class CreatorController {
  constructor(
    @Inject(CreatorService) private readonly creatorService: CreatorService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(ArchivedContentSweeperService)
    private readonly archivedContentSweeper: ArchivedContentSweeperService
  ) {}

  /** Studio UI flags: the client gates v2 surfaces (analytics, upload, payouts, onboarding) on these. */
  @Get('flags')
  async getFlags(): Promise<{ success: boolean; data: unknown }> {
    const all = await this.featureFlagService.getAllFlagsWithDefaults();
    const uiKeys = new Set(Object.values(creatorFlags));
    // Universe visibility sentinels ride along: the upload universe picker
    // hides disabled universes client-side (server truth stays /public/universes).
    const sentinelKeys = new Set(UNIVERSE_SLUGS.map(universeEnabledKey));
    return {
      success: true,
      data: all.filter(
        (f) =>
          uiKeys.has(f.key as (typeof creatorFlags)[keyof typeof creatorFlags]) ||
          sentinelKeys.has(f.key)
      ),
    };
  }

  @Get('dashboard')
  async getDashboard(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getDashboardStats(req.user.id),
    };
  }

  @Get('content')
  async getContent(
    @Request() req: AuthRequest,
    @Query() query: ListContentQueryDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getContent(
        req.user.id,
        query.page ?? 1,
        query.limit ?? 20,
        query.status
      ),
    };
  }

  @Get('content/:id/playback')
  async getPlaybackUrl(
    @Request() req: AuthRequest,
    @Param('id') id: string
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getPlaybackUrl(req.user.id, id),
    };
  }

  @Post('content')
  async createContent(
    @Request() req: AuthRequest,
    @Body() body: CreateContentDto
  ): Promise<{ success: boolean; data: unknown }> {
    const content = await this.creatorService.createContent(req.user.id, {
      ...body,
      type: body.type || 'video',
    });
    return {
      success: true,
      data: content,
    };
  }

  @Patch('content/:id')
  async updateContent(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: UpdateContentDto
  ): Promise<{ success: boolean; data: unknown }> {
    const content = await this.creatorService.updateContent(id, req.user.id, body);
    return {
      success: true,
      data: content,
    };
  }

  @Delete('content/:id')
  async deleteContent(
    @Request() req: AuthRequest,
    @Param('id') id: string
  ): Promise<{ success: boolean; data: { deleted: true } }> {
    await this.creatorService.deleteContent(id, req.user.id);
    return {
      success: true,
      data: { deleted: true },
    };
  }

  @Get('analytics')
  async getAnalytics(
    @Request() req: AuthRequest,
    @Query('period') period = '30days'
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getAnalytics(req.user.id, period),
    };
  }

  @Get('earnings')
  async getEarnings(
    @Request() req: AuthRequest,
    @Query('period') period = 'this-month'
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getEarnings(req.user.id, period),
    };
  }

  @Get('earnings/summary')
  async getEarningsSummary(
    @Request() req: AuthRequest
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getEarningsSummary(req.user.id),
    };
  }

  @Get('earnings/history')
  async getEarningsHistory(
    @Request() req: AuthRequest,
    @Query('limit') limit = 50
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getEarningsHistory(req.user.id, Number(limit)),
    };
  }

  @Get('payouts')
  async getPayouts(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getPayouts(req.user.id),
    };
  }

  @Post('payouts/request')
  async requestPayout(
    @Request() req: AuthRequest,
    @Body() body: RequestPayoutDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.requestPayout(req.user.id, body?.amount, body?.method),
    };
  }

  @Put('payouts/settings')
  async updatePayoutSettings(
    @Request() req: AuthRequest,
    @Body() body: UpdatePayoutSettingsDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updatePayoutSettings(req.user.id, body),
    };
  }

  @Get('settings')
  async getSettings(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getSettings(req.user.id),
    };
  }

  @Put('settings')
  async updateSettings(
    @Request() req: AuthRequest,
    @Body() body: UpdateSettingsDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updateSettings(req.user.id, body),
    };
  }

  // ── Draft / Published / Scheduled content shortcuts ──────────────
  @Get('drafts')
  async getDrafts(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getContent(req.user.id, Number(page), Number(limit), 'draft'),
    };
  }

  @Get('published')
  async getPublished(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getContent(
        req.user.id,
        Number(page),
        Number(limit),
        'published'
      ),
    };
  }

  @Get('scheduled')
  async getScheduled(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getContent(
        req.user.id,
        Number(page),
        Number(limit),
        'scheduled'
      ),
    };
  }

  // ── Content publish action ──────────────────────────────────────
  @Post('content/:id/publish')
  async publishContent(
    @Request() req: AuthRequest,
    @Param('id') id: string
  ): Promise<{ success: boolean; data: unknown }> {
    const content = await this.creatorService.updateContent(id, req.user.id, {
      status: 'published',
    } as Partial<ContentItem>);
    return { success: true, data: content };
  }

  // ── Monetization settings ───────────────────────────────────────
  @Get('monetization')
  async getMonetization(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getMonetization(req.user.id),
    };
  }

  @Put('monetization')
  async updateMonetization(
    @Request() req: AuthRequest,
    @Body()
    body: {
      tipEnabled?: boolean;
      tipMin?: number;
      tipMax?: number;
      payoutMethod?: string;
      isTipEnabled?: boolean;
      minimumTip?: number;
    }
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updateMonetization(req.user.id, body),
    };
  }

  // The web app reads/writes via PATCH /creator/monetization/settings
  @Get('monetization/settings')
  async getWebMonetizationSettings(
    @Request() req: AuthRequest
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getWebMonetizationSettings(req.user.id),
    };
  }
  @Patch('monetization/settings')
  async patchWebMonetizationSettings(
    @Request() req: AuthRequest,
    @Body() body: UpdateMonetizationSettingsDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updateMonetization(req.user.id, {
        tipEnabled: body.tippingEnabled,
        tipMin: body.minimumTip,
        tipMax: body.customTipAmounts?.length ? Math.max(...body.customTipAmounts) : undefined,
      }),
    };
  }

  // ── Subscription tiers (creator-owned, CRUD) ───────────────────
  @Get('monetization/tiers')
  async listSubscriptionTiers(
    @Request() req: AuthRequest
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getSubscriptionTiers(req.user.id),
    };
  }

  @Post('monetization/tiers')
  async createSubscriptionTier(
    @Request() req: AuthRequest,
    @Body() body: CreateSubscriptionTierDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.createSubscriptionTier(req.user.id, body),
    };
  }

  @Put('monetization/tiers/:id')
  async updateSubscriptionTier(
    @Request() req: AuthRequest,
    @Param('id') tierId: string,
    @Body() body: UpdateSubscriptionTierDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updateSubscriptionTier(req.user.id, tierId, body),
    };
  }

  @Delete('monetization/tiers/:id')
  async deleteSubscriptionTier(
    @Request() req: AuthRequest,
    @Param('id') tierId: string
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.deleteSubscriptionTier(req.user.id, tierId),
    };
  }

  // ── Creator profile ─────────────────────────────────────────────
  @Get('profile')
  async getOwnProfile(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    const profile = await this.creatorService.getCreatorProfile(req.user.id);
    return { success: true, data: profile };
  }

  @Put('profile')
  async updateOwnProfile(
    @Request() req: AuthRequest,
    @Body() body: UpdateProfileDto
  ): Promise<{ success: boolean; data: unknown }> {
    const profile = await this.creatorService.updateCreatorProfile(req.user.id, body);
    return { success: true, data: profile };
  }

  // ── Public creator profile (by id) ─────────────────────────────
  @Get('profile/:id')
  async getProfile(@Param('id') id: string): Promise<{ success: boolean; data: unknown }> {
    const profile = await this.creatorService.getCreatorProfile(id);
    return { success: true, data: profile };
  }

  // ── Subscribers ─────────────────────────────────────────────────
  @Get('subscribers')
  async getSubscribers(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getSubscribers(req.user.id, Number(page), Number(limit)),
    };
  }

  @Get('subscribers/stats')
  async getSubscriberStats(
    @Request() req: AuthRequest
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getSubscriberStats(req.user.id),
    };
  }

  // ── Uploads ─────────────────────────────────────────────────────
  @Get('uploads')
  async getUploads(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getUploads(req.user.id),
    };
  }

  @Post('uploads')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB cap matching the UI hint
    })
  )
  async createUpload(
    @Request() req: AuthRequest,
    @Body()
    body: { title: string; description?: string; type?: string; universe?: string },
    @UploadedFile() file?: Express.Multer.File
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.createUpload(req.user.id, body, file),
    };
  }

  // ── Challenges (proxied from creator-service) ───────────────────
  @Get('challenges')
  async getChallenges(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getChallenges(req.user.id),
    };
  }

  @Get('challenges/submissions')
  async getChallengeSubmissions(
    @Request() req: AuthRequest
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getChallengeSubmissions(req.user.id),
    };
  }

  @Get('challenges/submissions/:submissionId')
  async getChallengeSubmissionDetail(
    @Request() req: AuthRequest,
    @Param('submissionId') submissionId: string
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getChallengeSubmissionDetail(req.user.id, submissionId),
    };
  }

  @Get('challenges/:challengeId/leaderboard')
  async getChallengeLeaderboard(
    @Param('challengeId') challengeId: string
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getChallengeLeaderboard(challengeId),
    };
  }

  @Post('challenges/:challengeId/submit')
  async submitChallenge(
    @Request() req: AuthRequest,
    @Param('challengeId') challengeId: string,
    @Body() body: SubmitChallengeDto
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.submitChallenge(
        req.user.id,
        challengeId,
        body?.title ?? '',
        body?.contentId
      ),
    };
  }

  /**
   * On-demand hard-delete sweep for archived content. Admin-only: it
   * permanently deletes blob storage, so it must never be reachable by
   * ordinary creators (the class-level @Roles list admits them).
   */
  @Post('archived/sweep')
  @Roles('admin', 'superadmin')
  async sweepArchivedContent(): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.archivedContentSweeper.sweep(),
    };
  }
}
