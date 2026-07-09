import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { PredictionMarketsService } from './prediction-markets.service';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import {
  CreatePredictionDto,
  SubmitPredictionDto,
  ResolvePredictionDto,
} from './dto/prediction.dto';

@ApiTags('Prediction Markets')
@ApiBearerAuth()
@Controller('v1/sports/predictions')
export class PredictionMarketsController {
  constructor(private readonly predictionMarketsService: PredictionMarketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get prediction markets' })
  async getMarkets(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sport') sport?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.predictionMarketsService.getPredictionMarkets(
      Number(page),
      Number(limit),
      sport,
      status
    );
  }

  @Get('leaderboard')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get prediction leaderboard' })
  async getLeaderboard(@Query('limit') limit = 100): Promise<unknown> {
    return this.predictionMarketsService.getLeaderboard(Number(limit));
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user predictions' })
  async getUserPredictions(
    @Request() req: { user: { id: string } },
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.predictionMarketsService.getUserPredictions(
      req.user.id,
      Number(page),
      Number(limit)
    );
  }

  @Get(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get market by id' })
  async getMarket(@Param('id') id: string): Promise<unknown> {
    return this.predictionMarketsService.getMarketById(id);
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create prediction market (admin)' })
  async createMarket(@Body() body: CreatePredictionDto): Promise<unknown> {
    return this.predictionMarketsService.createPredictionMarket(
      body.fixtureId,
      body.selectedOption,
      [],
      undefined
    );
  }

  @Post(':id/predict')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Place prediction' })
  async placePrediction(
    @Param('id') marketId: string,
    @Body() body: SubmitPredictionDto,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.predictionMarketsService.placePrediction(
      req.user.id,
      marketId,
      body.selectedOption,
      body.stake
    );
  }

  @Post(':id/settle')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Settle market (admin)' })
  async settleMarket(
    @Param('id') marketId: string,
    @Body() body: ResolvePredictionDto
  ): Promise<unknown> {
    return this.predictionMarketsService.settleMarket(marketId, body.winningOption);
  }
}
