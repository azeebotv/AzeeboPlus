import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ModerationService } from './moderation.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResolveModerationDto, ModerationDecisionDto } from './dto/moderation.dto';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('v1/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('scan/:contentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Scan content for policy violations' })
  @ApiResponse({ status: 201, description: 'Content scan initiated' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async scanContent(
    @Param('contentId') contentId: string,
    @Body('type') type: 'malware' | 'nsfw' | 'hate_speech' | 'violence' | 'copyright' | 'spam' | 'misinformation' = 'malware'
  ): Promise<unknown> {
    return this.moderationService.scanContent(contentId, type);
  }

  @Get('risk/:contentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assess content risk' })
  @ApiResponse({ status: 200, description: 'Risk assessment' })
  async assessRisk(@Param('contentId') contentId: string): Promise<unknown> {
    return this.moderationService.getRiskAssessment(contentId);
  }

  @Get('scans/:contentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get content scan history' })
  @ApiResponse({ status: 200, description: 'Scan history' })
  async getContentScans(@Param('contentId') contentId: string): Promise<unknown> {
    return this.moderationService.getContentScans(contentId);
  }

  @Post('cases')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create moderation case' })
  @ApiResponse({ status: 201, description: 'Case created' })
  async createCase(@Body() data: {
    contentId: string;
    type: 'content' | 'user' | 'comment' | 'message';
    severity: 'low' | 'medium' | 'high' | 'critical';
    priority: 'low' | 'medium' | 'high';
    policyCategory: string;
    description: string;
    evidence?: Record<string, unknown>;
  }): Promise<unknown> {
    return this.moderationService.createCase(data);
  }

  @Get('cases')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get moderation cases' })
  @ApiResponse({ status: 200, description: 'Cases list' })
  async getCases(
    @Query('status') status?: 'open' | 'under_review' | 'resolved' | 'escalated' | 'dismissed',
    @Query('assignedTo') assignedTo?: string,
    @Query('priority') priority?: 'low' | 'medium' | 'high',
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.moderationService.getCases({
      status,
    });
  }

  @Get('cases/:caseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get moderation case by ID' })
  @ApiResponse({ status: 200, description: 'Case details' })
  async getCase(@Param('caseId') caseId: string): Promise<unknown> {
    return this.moderationService.getCaseById(caseId);
  }

  @Patch('cases/:caseId/assign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign case to moderator' })
  @ApiResponse({ status: 200, description: 'Case assigned' })
  async assignCase(
    @Param('caseId') caseId: string,
    @Request() req: { user: { userId: string } }
  ): Promise<unknown> {
    return this.moderationService.assignCase(caseId, req.user.userId);
  }

  @Patch('cases/:caseId/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve moderation case' })
  @ApiResponse({ status: 200, description: 'Case resolved' })
  async resolveCase(
    @Param('caseId') caseId: string,
    @Body() body: ResolveModerationDto,
    @Request() req: { user: { userId: string } }
  ): Promise<unknown> {
    return this.moderationService.resolveCase(caseId, {
      resolution: body.resolution,
      resolvedBy: req.user.userId,
      notes: body.notes,
    });
  }

  @Post('actions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute safety action' })
  @ApiResponse({ status: 201, description: 'Action executed' })
  async executeSafetyAction(
    @Body() data: {
      caseId: string;
      type: 'warning' | 'content_removal' | 'account_suspension' | 'account_ban' | 'content_aging' | 'visibility_reduction';
      targetId: string;
      targetType: 'user' | 'content' | 'comment';
      reason: string;
      durationDays?: number;
    },
    @Request() req: { user: { userId: string } }
  ): Promise<unknown> {
    return this.moderationService.executeAction({
      ...data,
      performedBy: req.user.userId,
    });
  }

  @Get('actions/case/:caseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get safety actions for case' })
  @ApiResponse({ status: 200, description: 'Actions list' })
  async getSafetyActions(@Param('caseId') caseId: string): Promise<unknown> {
    return this.moderationService.getSafetyActionsByCase(caseId);
  }

  @Post('appeals')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit appeal' })
  @ApiResponse({ status: 201, description: 'Appeal submitted' })
  async submitAppeal(@Body() data: {
    caseId: string;
    actionId: string;
    reason: string;
    evidence?: Record<string, unknown>;
  }, @Request() req: { user: { userId: string } }): Promise<unknown> {
    return this.moderationService.submitAppeal({
      caseId: data.caseId,
      userId: req.user.userId,
      reason: data.reason,
    });
  }

  @Patch('appeals/:appealId/review')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review appeal' })
  @ApiResponse({ status: 200, description: 'Appeal reviewed' })
  async reviewAppeal(
    @Param('appealId') appealId: string,
    @Body() body: ModerationDecisionDto,
    @Request() req: { user: { userId: string } }
  ): Promise<unknown> {
    return this.moderationService.reviewAppeal(appealId, req.user.userId, body.decision as 'successful' | 'rejected', body.notes);
  }

  @Get('trust/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user trust score' })
  @ApiResponse({ status: 200, description: 'Trust score' })
  async getTrustScore(@Param('userId') userId: string): Promise<unknown> {
    return this.moderationService.getTrustScore(userId);
  }

  @Patch('trust/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user trust score' })
  @ApiResponse({ status: 200, description: 'Trust score updated' })
  async updateTrustScore(
    @Param('userId') userId: string,
    @Body() data: { violation?: boolean; violationType?: string; positiveAction?: boolean }
  ): Promise<unknown> {
    return this.moderationService.updateTrustScore(userId, data);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('moderator', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: 200, description: 'Statistics' })
  async getStats(): Promise<unknown> {
    return this.moderationService.getModerationStats();
  }
}