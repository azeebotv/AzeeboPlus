import { Inject, Controller, Get, Query, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';
import { RecommendationService } from './recommendation.service';

@ApiTags('Recommendation')
@UseGuards(AuthGuard('jwt'), RateLimitGuard)
@Controller('recommendation')
export class RecommendationController {
  constructor(@Inject(RecommendationService) private readonly recommendationService: RecommendationService) {}

  @Public()
  @Get('content')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get content recommendations' })
  @ApiResponse({ status: 200, description: 'Content recommendations with explainability' })
  async getContentRecommendations(
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('universe') universe?: string,
    @Query('freshnessDays') freshnessDays?: string
  ): Promise<unknown> {
    return this.recommendationService.getContentRecommendations({
      userId,
      limit: limit ? parseInt(limit, 10) : 20,
      universe,
      freshnessDays: freshnessDays ? parseInt(freshnessDays, 10) : 7,
    });
  }

  @Get('creators')
  @ApiOperation({ summary: 'Get creator recommendations' })
  @ApiResponse({ status: 200, description: 'Creator recommendations' })
  async getCreatorRecommendations(
    @Query('userId') userId: string,
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.recommendationService.getCreatorRecommendations(
      userId,
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Get('cross-universe')
  @ApiOperation({ summary: 'Get cross-universe recommendations' })
  @ApiResponse({ status: 200, description: 'Cross-universe recommendations' })
  async getCrossUniverseRecommendations(
    @Query('userId') userId: string,
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.recommendationService.getCrossUniverseRecommendations(
      userId,
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
  async getUserSegment(@Query('userId') userId: string): Promise<unknown> {
    return this.recommendationService.getUserSegment(userId);
  }

  @Get('creator-score')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get creator score' })
  @ApiResponse({ status: 200, description: 'Creator score and tier' })
  async getCreatorScore(@Query('creatorId') creatorId: string): Promise<unknown> {
    return this.recommendationService.getCreatorScore(creatorId);
  }

  @Get('churn-risk')
  @ApiOperation({ summary: 'Get churn risk assessment' })
  @ApiResponse({ status: 200, description: 'Churn risk assessment' })
  async getChurnRisk(@Query('userId') userId: string): Promise<unknown> {
    return this.recommendationService.getChurnRisk(userId);
  }

  @Get('monetization-insights')
  @ApiOperation({ summary: 'Get monetization insights' })
  @ApiResponse({ status: 200, description: 'Monetization insights and recommendations' })
  async getMonetizationInsights(@Query('userId') userId: string): Promise<unknown> {
    return this.recommendationService.getMonetizationInsights(userId);
  }

  @Get('fraud-risk')
  @ApiOperation({ summary: 'Assess fraud risk' })
  @ApiResponse({ status: 200, description: 'Fraud risk assessment' })
  async assessFraudRisk(
    @Query('userId') userId?: string,
    @Query('contentId') contentId?: string,
    @Query('transactionId') transactionId?: string
  ): Promise<unknown> {
    return this.recommendationService.assessFraudRisk({ userId, contentId, transactionId });
  }

  @Get('personalized-feed')
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiResponse({ status: 200, description: 'Personalized content feed' })
  async getPersonalizedFeed(
    @Query('userId') userId: string,
    @Query('limit') limit?: string
  ): Promise<unknown> {
    return this.recommendationService.getPersonalizedFeed(userId, limit ? parseInt(limit, 10) : 20);
  }
}
