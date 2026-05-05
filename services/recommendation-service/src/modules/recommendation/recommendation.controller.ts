import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { RecommendationService } from './recommendation.service';
import { RecommendationResponse } from './interfaces/recommendation-response.interface';

@ApiTags('Recommendation')
@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('content')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get content recommendations' })
  @ApiResponse({ status: 200, description: 'Content recommendations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContentRecommendations(@Request() req: { user: { sub: string } }): Promise<RecommendationResponse> {
    return this.recommendationService.getContentRecommendations(req.user.sub);
  }

  @Get('creators')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get creator recommendations' })
  @ApiResponse({ status: 200, description: 'Creator recommendations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCreatorRecommendations(@Request() req: { user: { sub: string } }): Promise<RecommendationResponse> {
    return this.recommendationService.getCreatorRecommendations(req.user.sub);
  }

  @Get('cross-universe')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get cross-universe recommendations' })
  @ApiResponse({ status: 200, description: 'Cross-universe recommendations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCrossUniverseRecommendations(@Request() req: { user: { sub: string } }): Promise<RecommendationResponse> {
    return this.recommendationService.getCrossUniverseRecommendations(req.user.sub);
  }

  @Get('personalization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiResponse({ status: 200, description: 'Personalized feed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPersonalizedFeed(@Request() req: { user: { sub: string } }): Promise<RecommendationResponse> {
    return this.recommendationService.getPersonalizedFeed(req.user.sub);
  }
}
