import { Inject, Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { GamesService } from './games.service.js';
import { GameResponse } from './interfaces/game-response.interface.js';
import { SubmitAnswerDto } from './dto/submit-answer.dto.js';
import { StartSessionDto } from './dto/start-session.dto.js';

@ApiTags('Games')
@Controller('v1/games')
export class GamesController {
  constructor(@Inject(GamesService) private readonly gamesService: GamesService) {}

  @Get('home')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Games home' })
  @ApiResponse({ status: 200, description: 'Games home' })
  async getHome(): Promise<GameResponse> {
    return this.gamesService.getHome();
  }

  @Post('daily-challenge/submit')
  @ApiOperation({ summary: 'Submit daily challenge answer' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitDailyChallenge(
    @Request() req: { user: { id: string } },
    @Body() body: SubmitAnswerDto
  ): Promise<GameResponse> {
    return this.gamesService.submitDailyChallenge(req.user.id, body.answer);
  }

  @Get('daily-challenge')
  @ApiOperation({ summary: 'Daily challenge' })
  @ApiResponse({ status: 200, description: 'Daily challenge' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailyChallenge(@Request() req: { user: { id: string } }): Promise<GameResponse> {
    return this.gamesService.getDailyChallenge(req.user.id);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Start game session' })
  @ApiResponse({ status: 201, description: 'Session started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startSession(
    @Request() req: { user: { id: string } },
    @Body() body: StartSessionDto
  ): Promise<GameResponse> {
    return this.gamesService.startSession(req.user.id, body.challengeId);
  }

  @Post('sessions/:sessionId/submit')
  @ApiOperation({ summary: 'Submit answer' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitAnswer(
    @Request() req: { user: { id: string } },
    @Param('sessionId') sessionId: string,
    @Body() body: SubmitAnswerDto
  ): Promise<GameResponse> {
    return this.gamesService.submitAnswer(req.user.id, sessionId, body.answer);
  }

  @Get('leaderboard')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Games leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(): Promise<GameResponse> {
    return this.gamesService.getLeaderboard();
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'Tournament list' })
  @ApiResponse({ status: 200, description: 'Tournaments' })
  async listTournaments(): Promise<GameResponse> {
    return this.gamesService.listTournaments();
  }

  @Post('tournaments/:tournamentId/enter')
  @ApiOperation({ summary: 'Enter tournament' })
  @ApiResponse({ status: 201, description: 'Entered tournament' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enterTournament(
    @Request() req: { user: { id: string } },
    @Param('tournamentId') tournamentId: string
  ): Promise<GameResponse> {
    return this.gamesService.enterTournament(req.user.id, tournamentId);
  }
}
