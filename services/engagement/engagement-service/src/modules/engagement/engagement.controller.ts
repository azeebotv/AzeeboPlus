import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { EngagementService } from './engagement.service.js';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { User } from '@azeebo/shared-types';
import { SubmitPredictionDto } from './dto/submit-prediction.dto.js';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('Engagement')
@ApiBearerAuth()
@Controller('v1/engagement')
@UseGuards(RateLimitGuard)
export class EngagementController {
  constructor(@Inject(EngagementService) private readonly engagementService: EngagementService) {}

  @Get('leaderboard')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get leaderboard entries' })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  async getLeaderboard(
    @Query('timePeriod') timePeriod = 'weekly',
    @Query('category') category = 'all',
    @Query('limit') limit = 50
  ) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    return this.engagementService.getLeaderboard(timePeriod, category, clampedLimit);
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
  async getPredictionResults(@Request() req: AuthRequest, @Param('contentId') contentId: string) {
    return this.engagementService.getPredictionResults(req.user.id, contentId);
  }

  @Post('predictions')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Submit a prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  async submitPrediction(@Request() req: AuthRequest, @Body() dto: SubmitPredictionDto) {
    return this.engagementService.submitPrediction(req.user.id, dto.contentId, dto.prediction);
  }
}
