import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { EngagementService } from './engagement.service.js';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, engagementFlags } from '@azeebo/feature-flags';
import { User } from '@azeebo/shared-types';
import { SubmitPredictionDto } from './dto/submit-prediction.dto.js';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('Engagement')
@ApiBearerAuth()
@Controller('engagement')
@UseGuards(RateLimitGuard)
export class EngagementController {
  constructor(@Inject(EngagementService) private readonly engagementService: EngagementService) {}

  @Get('leaderboard')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.leaderboards)
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

  @Get('leaderboard/export')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.leaderboards)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Export leaderboard data' })
  @ApiResponse({ status: 200, description: 'Exported leaderboard data' })
  async exportLeaderboard(
    @Query('timePeriod') timePeriod = 'weekly',
    @Query('category') category = 'all',
    @Query('format') format: 'csv' | 'json' = 'json'
  ) {
    return this.engagementService.exportLeaderboard(timePeriod, category, format);
  }

  @Delete('leaderboard/:userId/:category')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.leaderboards)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete a leaderboard entry' })
  @ApiResponse({ status: 200, description: 'Leaderboard entry deleted' })
  async deleteLeaderboardEntry(
    @Param('userId') userId: string,
    @Param('category') category: string
  ) {
    return this.engagementService.deleteRanking(userId, category);
  }

  @Get('rankings')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.rankings)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get rankings by category' })
  @ApiResponse({ status: 200, description: 'Rankings data' })
  async getRankings() {
    return this.engagementService.getRankings();
  }

  @Post('rankings')
  @RateLimit(20, 60000)
  @ApiOperation({ summary: 'Create or update a ranking' })
  @ApiResponse({ status: 201, description: 'Ranking created/updated' })
  async createOrUpdateRanking(
    @Request() req: AuthRequest,
    @Body() body: { category: string; score: number; displayName?: string; avatar?: string }
  ) {
    return this.engagementService.createOrUpdateRanking(
      req.user.id,
      body.displayName || req.user.displayName || 'Unknown',
      body.avatar || null,
      body.category,
      body.score
    );
  }

  @Post('rankings/batch')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Batch update rankings' })
  @ApiResponse({ status: 200, description: 'Rankings batch updated' })
  async batchUpdateRankings(
    @Body()
    body: {
      updates: Array<{
        userId: string;
        displayName: string;
        avatar?: string;
        category: string;
        score: number;
      }>;
    }
  ) {
    return this.engagementService.batchUpdateRankings(
      body.updates.map((u) => ({ ...u, avatar: u.avatar || null }))
    );
  }

  @Get('rankings/history/:userId')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.rankings)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get ranking history for a user' })
  @ApiResponse({ status: 200, description: 'Ranking history' })
  async getRankingHistory(
    @Param('userId') userId: string,
    @Query('category') category?: string,
    @Query('limit') limit = 50
  ) {
    return this.engagementService.getRankingHistory(userId, category, Number(limit));
  }

  @Delete('rankings/:userId/:category')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.rankings)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete a ranking' })
  @ApiResponse({ status: 200, description: 'Ranking deleted' })
  async deleteRanking(@Param('userId') userId: string, @Param('category') category: string) {
    return this.engagementService.deleteRanking(userId, category);
  }

  @Get('predictions/:contentId/results')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.predictions)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get prediction results for a content' })
  @ApiResponse({ status: 200, description: 'Prediction results' })
  async getPredictionResults(@Request() req: AuthRequest, @Param('contentId') contentId: string) {
    return this.engagementService.getPredictionResults(req.user.id, contentId);
  }

  @Get('predictions/history')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.predictions)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get prediction history for current user' })
  @ApiResponse({ status: 200, description: 'Prediction history' })
  async getPredictionHistory(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return this.engagementService.getPredictionHistory(req.user.id, Number(page), Number(limit));
  }

  @Post('predictions')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.predictions)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Submit a prediction' })
  @ApiResponse({ status: 201, description: 'Prediction submitted' })
  async submitPrediction(@Request() req: AuthRequest, @Body() dto: SubmitPredictionDto) {
    return this.engagementService.submitPrediction(req.user.id, dto.contentId, dto.prediction);
  }

  @Put('predictions/:predictionId')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.predictions)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Update a prediction' })
  @ApiResponse({ status: 200, description: 'Prediction updated' })
  async updatePrediction(
    @Request() req: AuthRequest,
    @Param('predictionId') predictionId: string,
    @Body() body: { prediction?: string; category?: string; metadata?: Record<string, unknown> }
  ) {
    return this.engagementService.updatePrediction(req.user.id, predictionId, body);
  }

  @Delete('predictions/:predictionId')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.predictions)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete a prediction' })
  @ApiResponse({ status: 200, description: 'Prediction deleted' })
  async deletePrediction(@Request() req: AuthRequest, @Param('predictionId') predictionId: string) {
    return this.engagementService.deletePrediction(req.user.id, predictionId);
  }

  @Post('predictions/bulk')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(engagementFlags.predictions)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Submit multiple predictions' })
  @ApiResponse({ status: 201, description: 'Predictions submitted' })
  async bulkSubmitPredictions(
    @Request() req: AuthRequest,
    @Body()
    body: { predictions: Array<{ contentId: string; prediction: string; category?: string }> }
  ) {
    return this.engagementService.bulkSubmitPredictions(req.user.id, body.predictions);
  }
}
