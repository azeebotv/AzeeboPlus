import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { RecommendationsService } from './recommendations.service';
import { RecommendationResponse } from './interfaces/recommendation-response.interface';

@ApiTags('Recommendations')
@ApiBearerAuth()
@Controller('v1/recommendation')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('creators')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get creator recommendations' })
  @ApiResponse({ status: 200, description: 'Creator recommendations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCreatorRecommendations(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: number
  ): Promise<RecommendationResponse> {
    return this.recommendationsService.getCreatorRecommendations(
      req.user.sub,
      limit ? Number(limit) : 20
    );
  }

  @Get('cross-universe')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get cross-universe recommendations' })
  @ApiResponse({ status: 200, description: 'Cross-universe recommendations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCrossUniverseRecommendations(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: number
  ): Promise<RecommendationResponse> {
    return this.recommendationsService.getCrossUniverseRecommendations(
      req.user.sub,
      limit ? Number(limit) : 20
    );
  }
}
