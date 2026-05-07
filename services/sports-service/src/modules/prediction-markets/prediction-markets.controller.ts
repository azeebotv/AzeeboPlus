import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PredictionMarketsService } from './prediction-markets.service';

@ApiTags('Prediction Markets')
@Controller('predictions')
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
  @ApiOperation({ summary: 'Get prediction leaderboard' })
  async getLeaderboard(@Query('limit') limit = 100): Promise<unknown> {
    return this.predictionMarketsService.getLeaderboard(Number(limit));
  }

  @Get('my')
  @ApiOperation({ summary: 'Get user predictions' })
  async getUserPredictions(
    @Body() body: { userId: string },
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.predictionMarketsService.getUserPredictions(
      body.userId,
      Number(page),
      Number(limit)
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get market by id' })
  async getMarket(@Param('id') id: string): Promise<unknown> {
    return this.predictionMarketsService.getMarketById(id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create prediction market (admin)' })
  async createMarket(
    @Body()
    body: {
      eventId: string;
      question: string;
      options: unknown[];
      odds?: unknown;
    }
  ): Promise<unknown> {
    return this.predictionMarketsService.createPredictionMarket(
      body.eventId,
      body.question,
      body.options,
      body.odds
    );
  }

  @Post(':id/predict')
  @ApiOperation({ summary: 'Place prediction' })
  async placePrediction(
    @Param('id') marketId: string,
    @Body() body: { userId: string; selectedOption: string; stake?: number }
  ): Promise<unknown> {
    return this.predictionMarketsService.placePrediction(
      body.userId,
      marketId,
      body.selectedOption,
      body.stake
    );
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Settle market (admin)' })
  async settleMarket(
    @Param('id') marketId: string,
    @Body() body: { winningOption: string }
  ): Promise<unknown> {
    return this.predictionMarketsService.settleMarket(marketId, body.winningOption);
  }
}
