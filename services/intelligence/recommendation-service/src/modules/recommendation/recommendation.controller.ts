import { Inject, Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { RecommendationService } from './recommendation.service.js';

@ApiTags('Recommendation')
@UseGuards(RateLimitGuard)
@Controller('recommendation')
export class RecommendationController {
  constructor(
    @Inject(RecommendationService) private readonly recommendationService: RecommendationService
  ) {}

  @Public()
  @Get('content')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get content recommendations' })
  @ApiResponse({ status: 200, description: 'Content recommendations with explainability' })
  async getContentRecommendations(
    @Request() req: { user?: { id: string } },
    @Query('limit') limit?: string,
    @Query('universe') universe?: string,
    @Query('freshnessDays') freshnessDays?: string
  ): Promise<unknown> {
    return this.recommendationService.getContentRecommendations({
      userId: req.user?.id,
      limit: limit ? parseInt(limit, 10) : 20,
      universe,
      freshnessDays: freshnessDays ? parseInt(freshnessDays, 10) : 7,
    });
  }

  @Get('creators')
  @ApiOperation({ summary: 'Get creator recommendations' })
  @ApiResponse({ status: 200, description: 'Creator recommendations' })
  async getCreatorRecommendations(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.recommendationService.getCreatorRecommendations(
      req.user.id,
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Get('cross-universe')
  @ApiOperation({ summary: 'Get cross-universe recommendations' })
  @ApiResponse({ status: 200, description: 'Cross-universe recommendations' })
  async getCrossUniverseRecommendations(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.recommendationService.getCrossUniverseRecommendations(
      req.user.id,
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Public()
  @Get('trending')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get trending content' })
  @ApiResponse({ status: 200, description: 'Trending content' })
  async getTrending(
    @Query('limit') limit?: string,
    @Query('universe') universe?: string
  ): Promise<unknown> {
    return this.recommendationService.getContentRecommendations({
      limit: limit ? parseInt(limit, 10) : 20,
      universe,
      freshnessDays: 7,
    });
  }

  @Get('user-segment')
  @ApiOperation({ summary: 'Get user segment' })
  @ApiResponse({ status: 200, description: 'User segment information' })
  async getUserSegment(@Request() req: { user: { id: string } }): Promise<unknown> {
    return this.recommendationService.getUserSegment(req.user.id);
  }

  @Get('creator-score')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get creator score' })
  @ApiResponse({ status: 200, description: 'Creator score and tier' })
  async getCreatorScore(@Request() req: { user: { id: string } }): Promise<unknown> {
    return this.recommendationService.getCreatorScore(req.user.id);
  }

  @Get('churn-risk')
  @ApiOperation({ summary: 'Get churn risk assessment' })
  @ApiResponse({ status: 200, description: 'Churn risk assessment' })
  async getChurnRisk(@Request() req: { user: { id: string } }): Promise<unknown> {
    return this.recommendationService.getChurnRisk(req.user.id);
  }

  @Get('monetization-insights')
  @ApiOperation({ summary: 'Get monetization insights' })
  @ApiResponse({ status: 200, description: 'Monetization insights and recommendations' })
  async getMonetizationInsights(@Request() req: { user: { id: string } }): Promise<unknown> {
    return this.recommendationService.getMonetizationInsights(req.user.id);
  }

  @Get('fraud-risk')
  @ApiOperation({ summary: 'Assess fraud risk' })
  @ApiResponse({ status: 200, description: 'Fraud risk assessment' })
  async assessFraudRisk(
    @Request() req: { user: { id: string } },
    @Query('contentId') contentId?: string,
    @Query('transactionId') transactionId?: string
  ): Promise<unknown> {
    return this.recommendationService.assessFraudRisk({
      userId: req.user.id,
      contentId,
      transactionId,
    });
  }

  @Get('personalized-feed')
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiResponse({ status: 200, description: 'Personalized content feed' })
  async getPersonalizedFeed(
    @Request() req: { user: { id: string } },
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.recommendationService.getPersonalizedFeed(
      req.user.id,
      limit ? parseInt(limit, 10) : 20
    );
  }
}
