import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '@azeebo/security';
import { IntelligenceService } from './intelligence.service';

@ApiTags('Intelligence Layer')
@UseGuards(AuthGuard('jwt'))
@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Get('personalization')
  @ApiOperation({ summary: 'Get personalization data for user' })
  async getPersonalization(@Request() req: { user: { sub: string } }): Promise<unknown> {
    return this.intelligenceService.getPersonalization(req.user.sub);
  }

  @Get('segments')
  @ApiOperation({ summary: 'Get audience segments' })
  async getSegments(): Promise<unknown> {
    return this.intelligenceService.getAudienceSegments();
  }

  @Post('segments')
  @ApiOperation({ summary: 'Create audience segment' })
  async createSegment(
    @Body()
    body: {
      name: string;
      segmentType: 'behavioral' | 'demographic' | 'firmographic';
      criteria: Record<string, unknown>;
    }
  ): Promise<unknown> {
    return this.intelligenceService.createAudienceSegment(
      body.name,
      body.segmentType,
      body.criteria
    );
  }

  @Get('creator-scores')
  @ApiOperation({ summary: 'Get creator scores' })
  async getCreatorScores(@Query('universe') universe?: string): Promise<unknown> {
    return this.intelligenceService.getCreatorScores(universe);
  }

  @Post('creator-scores/:creatorId/calculate')
  @ApiOperation({ summary: 'Calculate creator score' })
  async calculateCreatorScore(@Param('creatorId') creatorId: string): Promise<unknown> {
    return this.intelligenceService.calculateCreatorScore(creatorId);
  }

  @Get('churn-risks')
  @ApiOperation({ summary: 'Get churn risks' })
  async getChurnRisks(@Query('threshold') threshold = 0.5): Promise<unknown> {
    return this.intelligenceService.getChurnRisks(Number(threshold));
  }

  @Post('churn-risks/:userId/calculate')
  @ApiOperation({ summary: 'Calculate churn risk for user' })
  async calculateChurnRisk(@Param('userId') userId: string): Promise<unknown> {
    return this.intelligenceService.calculateChurnRisk(userId);
  }

  @Get('fraud-detections')
  @ApiOperation({ summary: 'Get fraud detections' })
  async getFraudDetections(@Query('status') status?: string): Promise<unknown> {
    return this.intelligenceService.getFraudDetections(status);
  }

  @Post('fraud-detections')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Report fraud detection' })
  async detectFraud(
    @Request() req: { user: { id: string; sub?: string } },
    @Body()
    body: {
      eventType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      details: Record<string, unknown>;
    }
  ): Promise<unknown> {
    return this.intelligenceService.detectFraud(
      req.user.sub,
      body.eventType,
      body.severity,
      body.details
    );
  }

  @Post('fraud-detections/:id/review')
  @ApiOperation({ summary: 'Review fraud detection' })
  async reviewFraudDetection(
    @Param('id') id: string,
    @Request() req: { user: { sub?: string; id?: string } },
    @Body() body: { status: 'confirmed' | 'cleared' }
  ): Promise<unknown> {
    const reviewedBy = req.user?.sub || req.user?.id;
    return this.intelligenceService.reviewFraudDetection(id, reviewedBy, body.status);
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get retention metrics' })
  async getRetentionMetrics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ): Promise<unknown> {
    const dateRange =
      fromDate && toDate ? { from: new Date(fromDate), to: new Date(toDate) } : undefined;
    return this.intelligenceService.getRetentionMetrics(dateRange);
  }
}
