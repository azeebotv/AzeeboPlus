import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { EngagementService } from './engagement.service';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { User } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('Engagement')
@ApiBearerAuth()
@Controller('v1/engagement')
@UseGuards(AuthGuard('jwt'), RateLimitGuard)
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('leaderboard')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get leaderboard entries' })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  async getLeaderboard(
    @Query('timePeriod') timePeriod = 'weekly',
    @Query('category') category = 'all',
    @Query('limit') limit = 50
  ) {
    return this.engagementService.getLeaderboard(timePeriod, category, Number(limit));
  }

  @Get('rankings')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get rankings by category' })
  @ApiResponse({ status: 200, description: 'Rankings data' })
  async getRankings() {
    return this.engagementService.getRankings();
  }

  @Get('predictions/:contentId/results')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get prediction results for a content' })
  @ApiResponse({ status: 200, description: 'Prediction results' })
  async getPredictionResults(@Request() req: AuthRequest, @Query('contentId') contentId: string) {
    return this.engagementService.getPredictionResults(req.user.id, contentId);
  }

  @Post('predictions')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Submit a prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  async submitPrediction(
    @Request() req: AuthRequest,
    @Body() body: { contentId: string; prediction: string; points: number }
  ) {
    return this.engagementService.submitPrediction(
      req.user.id,
      body.contentId,
      body.prediction,
      body.points
    );
  }
}
