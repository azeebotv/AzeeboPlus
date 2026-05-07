import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { GamesService } from './games.service';
import { GameResponse } from './interfaces/game-response.interface';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('home')
  @ApiOperation({ summary: 'Games home' })
  @ApiResponse({ status: 200, description: 'Games home' })
  async getHome(): Promise<GameResponse> {
    return this.gamesService.getHome();
  }

  @Get('daily-challenge')
  @ApiOperation({ summary: 'Daily challenge' })
  @ApiResponse({ status: 200, description: 'Daily challenge' })
  async getDailyChallenge(): Promise<GameResponse> {
    return this.gamesService.getDailyChallenge();
  }

  @Post('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Start game session' })
  @ApiResponse({ status: 201, description: 'Session started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startSession(
    @Request() req: { user: { sub: string } },
    @Body() body: { challengeId: string }
  ): Promise<GameResponse> {
    return this.gamesService.startSession(req.user.sub, body.challengeId);
  }

  @Post('sessions/:sessionId/submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit answer' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitAnswer(
    @Request() req: { user: { sub: string } },
    @Param('sessionId') sessionId: string,
    @Body() body: { answer: string }
  ): Promise<GameResponse> {
    return this.gamesService.submitAnswer(req.user.sub, sessionId, body.answer);
  }

  @Get('leaderboard')
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Enter tournament' })
  @ApiResponse({ status: 201, description: 'Entered tournament' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enterTournament(
    @Request() req: { user: { sub: string } },
    @Param('tournamentId') tournamentId: string
  ): Promise<GameResponse> {
    return this.gamesService.enterTournament(req.user.sub, tournamentId);
  }
}
