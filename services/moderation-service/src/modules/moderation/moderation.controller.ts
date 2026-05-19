import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { ModerationService } from './moderation.service';
import { ModerationResponse } from './interfaces/moderation-response.interface';
import { CreateReportDto, EscalateCaseDto, ScanContentDto } from './dto/moderation.dto';

@ApiTags('Moderation')
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Report content or user' })
  @ApiResponse({ status: 201, description: 'Report created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reportContent(
    @Request() req: { user: { sub: string } },
    @Body() body: CreateReportDto
  ): Promise<ModerationResponse> {
    return this.moderationService.reportContent(req.user.sub, body);
  }

  @Get('report-types')
  @ApiOperation({ summary: 'List report types' })
  @ApiResponse({ status: 200, description: 'Report types' })
  async getReportTypes(): Promise<ModerationResponse> {
    return this.moderationService.getReportTypes();
  }

  @Post('appeal')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit appeal' })
  @ApiResponse({ status: 201, description: 'Appeal created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitAppeal(
    @Request() req: { user: { sub: string } },
    @Body() body: EscalateCaseDto
  ): Promise<ModerationResponse> {
    return this.moderationService.submitAppeal(req.user.sub, body);
  }

  @Get('queue')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiResponse({ status: 200, description: 'Moderation queue' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueue(@Request() req: { user: { sub: string } }): Promise<ModerationResponse> {
    return this.moderationService.getQueue(req.user.sub);
  }

  @Get('trust-score/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user trust score' })
  @ApiResponse({ status: 200, description: 'Trust score' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrustScore(@Param('userId') userId: string): Promise<{ success: boolean; data: { userId: string; trustScore: number } }> {
    const trustScore = await this.moderationService.getTrustScore(userId);
    return { success: true, data: { userId, trustScore } };
  }

  @Post('safety-action')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Take safety action' })
  @ApiResponse({ status: 200, description: 'Safety action taken' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Target not found' })
  async takeSafetyAction(
    @Request() req: { user: { sub: string } },
    @Body()
    body: {
      type: string;
      targetId: string;
      targetType: 'content' | 'user';
      reason: string;
      duration?: number;
    }
  ): Promise<ModerationResponse> {
    return this.moderationService.takeSafetyAction(req.user.sub, body);
  }

  @Get('safety-actions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get safety actions' })
  @ApiResponse({ status: 200, description: 'Safety actions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSafetyActions(
    @Request() req: { user: { sub: string } },
    @Query('targetType') targetType?: 'content' | 'user',
    @Query('actionType') actionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ModerationResponse> {
    return this.moderationService.getSafetyActions(req.user.sub, {
      targetType,
      actionType,
      startDate,
      endDate,
    });
  }

  @Get('safety-action-types')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get safety action types' })
  @ApiResponse({ status: 200, description: 'Safety action types' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSafetyActionTypes(): Promise<ModerationResponse> {
    return this.moderationService.getSafetyActionTypes();
  }

  @Post('scan')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Scan content media for safety issues' })
  @ApiResponse({ status: 200, description: 'Scan result' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async scanContentMedia(
    @Body() body: ScanContentDto
  ): Promise<unknown> {
    return this.moderationService.scanContentMedia({
      contentId: body.contentId,
      mediaUrl: body.mediaUrl,
      scanTypes: body.scanTypes as ('malware' | 'content_safety' | 'copyright')[] | undefined,
    });
  }

  @Get('scan/:scanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get scan result by ID' })
  @ApiResponse({ status: 200, description: 'Scan result' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getScanById(@Param('scanId') scanId: string): Promise<ModerationResponse> {
    return this.moderationService.getScanById(scanId);
  }

  @Get('content/:contentId/safety')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check content safety status' })
  @ApiResponse({ status: 200, description: 'Safety status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkContentSafety(@Param('contentId') contentId: string): Promise<ModerationResponse> {
    return this.moderationService.checkContentSafety(contentId);
  }
}
