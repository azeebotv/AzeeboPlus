import { Inject, Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard, Public } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, gamesFlags } from '@azeebo/feature-flags';

import { GamesService } from './games.service.js';
import { GameRealtimeService } from './game-realtime.service.js';
import { GameResponse } from './interfaces/game-response.interface.js';
import { SubmitAnswerDto } from './dto/submit-answer.dto.js';
import { StartSessionDto } from './dto/start-session.dto.js';

@ApiTags('Games')
@ApiBearerAuth()
@UseGuards(ServiceAuthGuard)
@Controller('games')
export class GamesController {
  constructor(
    @Inject(GamesService) private readonly gamesService: GamesService,
    @Inject(GameRealtimeService) private readonly realtimeService: GameRealtimeService
  ) {}

  @Public()
  @Get('home')
  @Get('featured')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Games home / featured' })
  @ApiResponse({ status: 200, description: 'Games home' })
  async getHome(): Promise<GameResponse> {
    return this.gamesService.getHome();
  }

  @Public()
  @Get('trending')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Games trending' })
  @ApiResponse({ status: 200, description: 'Trending games' })
  async getTrending(): Promise<GameResponse> {
    return this.gamesService.getHome();
  }

  @Public()
  @Get('trivia')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(gamesFlags.triviaAi)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Trivia games' })
  @ApiResponse({ status: 200, description: 'Trivia games list' })
  async getTrivia(): Promise<GameResponse> {
    return this.gamesService.getHome();
  }

  @Get('stats')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Game stats for user' })
  @ApiResponse({ status: 200, description: 'User game stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(): Promise<GameResponse> {
    return this.gamesService.getLeaderboard();
  }

  @Post('daily-challenge/submit')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
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
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Daily challenge' })
  @ApiResponse({ status: 200, description: 'Daily challenge' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailyChallenge(@Request() req: { user: { id: string } }): Promise<GameResponse> {
    return this.gamesService.getDailyChallenge(req.user.id);
  }

  @Post('sessions')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(gamesFlags.triviaAi)
  @RateLimit(10, 60000)
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
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
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

  @Public()
  @Get('leaderboard')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(gamesFlags.leaderboardsSeasonal)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Games leaderboard (games_leaderboards_seasonal)' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  @ApiResponse({ status: 403, description: 'Flag off, or forbidden' })
  async getLeaderboard(): Promise<GameResponse> {
    return this.gamesService.getLeaderboard();
  }

  @Public()
  @Get('tournaments')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Tournament list' })
  @ApiResponse({ status: 200, description: 'Tournaments' })
  async listTournaments(): Promise<GameResponse> {
    return this.gamesService.listTournaments();
  }

  @Post('tournaments/:tournamentId/enter')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Enter tournament' })
  @ApiResponse({ status: 201, description: 'Entered tournament' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async enterTournament(
    @Request() req: { user: { id: string } },
    @Param('tournamentId') tournamentId: string
  ): Promise<GameResponse> {
    return this.gamesService.enterTournament(req.user.id, tournamentId);
  }

  // ========================
  // Real-time multiplayer sessions
  // ========================

  @Post('multiplayer/sessions')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create multiplayer game session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async createSession(
    @Request() req: { user: { id: string } },
    @Body() body: { gameId: string; maxPlayers?: number }
  ) {
    const session = await this.realtimeService.createSession(
      body.gameId,
      req.user.id,
      body.maxPlayers
    );
    return { success: true, data: session };
  }

  @Post('multiplayer/sessions/:sessionId/join')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Join multiplayer session' })
  @ApiResponse({ status: 200, description: 'Joined session' })
  async joinSession(
    @Request() req: { user: { id: string } },
    @Param('sessionId') sessionId: string
  ) {
    const session = await this.realtimeService.joinSession(sessionId, req.user.id);
    return { success: true, data: session };
  }

  @Post('multiplayer/sessions/:sessionId/start')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Start multiplayer session' })
  @ApiResponse({ status: 200, description: 'Session started' })
  async startMultiplayerSession(@Param('sessionId') sessionId: string) {
    const session = await this.realtimeService.startSession(sessionId);
    return { success: true, data: session };
  }

  @Get('multiplayer/sessions/:sessionId')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get session state' })
  @ApiResponse({ status: 200, description: 'Session state' })
  async getSessionState(@Request() req: { user: { id: string } }) {
    const session = this.realtimeService.getPlayerSession(req.user.id);
    return { success: true, data: session };
  }

  @Get('multiplayer/game/:gameId/sessions')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'List active sessions for a game' })
  @ApiResponse({ status: 200, description: 'Active sessions' })
  async listGameSessions(@Param('gameId') gameId: string) {
    const sessions = this.realtimeService.getGameSessions(gameId);
    return { success: true, data: sessions };
  }
}
