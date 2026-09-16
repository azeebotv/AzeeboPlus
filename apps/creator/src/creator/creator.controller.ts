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
import { FeatureFlagService, creatorFlags } from '@azeebo/feature-flags';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('creator', 'admin', 'superadmin')
@Controller('creator')
export class CreatorController {
  constructor(
    @Inject(CreatorService) private readonly creatorService: CreatorService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {}

  /** Studio UI flags: the client gates v2 surfaces (analytics, upload, payouts, onboarding) on these. */
  @Get('flags')
  async getFlags(): Promise<{ success: boolean; data: unknown }> {
    const all = await this.featureFlagService.getAllFlagsWithDefaults();
    const uiKeys = new Set(Object.values(creatorFlags));
    return {
      success: true,
      data: all.filter((f) =>
        uiKeys.has(f.key as (typeof creatorFlags)[keyof typeof creatorFlags])
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
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getContent(req.user.id, Number(page), Number(limit), status),
    };
  }

  @Post('content')
  async createContent(
    @Request() req: AuthRequest,
    @Body() body: { title: string; description?: string; type: string }
  ): Promise<{ success: boolean; data: unknown }> {
    const content = await this.creatorService.createContent(req.user.id, body);
    return {
      success: true,
      data: content,
    };
  }

  @Patch('content/:id')
  async updateContent(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: Partial<ContentItem>
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
    @Body() body: { amount?: number; method?: string }
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.requestPayout(req.user.id, body?.amount, body?.method),
    };
  }

  @Put('payouts/settings')
  async updatePayoutSettings(
    @Request() req: AuthRequest,
    @Body() body: { method: string; minimum: number }
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
    @Body()
    body: {
      payoutMethod?: string;
      minimumPayout?: number;
      notifications?: { email: boolean; push: boolean; sms: boolean; marketing: boolean };
      privacy?: { profileVisibility: string; showEarnings: boolean; allowMessages: boolean };
    }
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
  }  @Patch('monetization/settings')
  async patchWebMonetizationSettings(
    @Request() req: AuthRequest,
    @Body()
    body: {
      tipsEnabled?: boolean;
      minimumTipAmount?: number;
      customTipAmounts?: number[];
      payoutMethod?: string;
    }
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updateMonetization(req.user.id, {
        tipEnabled: body.tipsEnabled,
        tipMin: body.minimumTipAmount,
        tipMax: body.customTipAmounts?.length
          ? Math.max(...body.customTipAmounts)
          : undefined,
        payoutMethod: body.payoutMethod,
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
    @Body()
    body: {
      name?: string;
      price?: number;
      perks?: string[];
      isActive?: boolean;
      displayOrder?: number;
    }
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
    @Body()
    body: {
      name?: string;
      price?: number;
      perks?: string[];
      isActive?: boolean;
      displayOrder?: number;
    }
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
    @Body()
    body: {
      bio?: string;
      banner?: string;
      displayName?: string;
      avatar?: string;
      website?: string;
      socialLinks?: Record<string, string>;
    }
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

  @Post('challenges/:challengeId/submit')
  async submitChallenge(
    @Request() req: AuthRequest,
    @Param('challengeId') challengeId: string,
    @Body() body: { title: string }
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.submitChallenge(req.user.id, challengeId, body?.title ?? ''),
    };
  }
}
