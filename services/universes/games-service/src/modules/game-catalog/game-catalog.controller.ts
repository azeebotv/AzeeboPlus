import { Inject, Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GameCatalogService } from './game-catalog.service.js';

@ApiTags('Game Catalog')
@Controller('games')
export class GameCatalogController {
  constructor(
    @Inject(GameCatalogService) private readonly gameCatalogService: GameCatalogService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get games' })
  @ApiResponse({ status: 200, description: 'Games list' })
  async getGames(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string
  ): Promise<unknown> {
    return this.gameCatalogService.getGames(Number(page), Number(limit), category, difficulty);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get game categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(): Promise<unknown> {
    return this.gameCatalogService.getCategories();
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get user stats' })
  @ApiResponse({ status: 200, description: 'User stats' })
  async getUserStats(@Param('userId') userId: string): Promise<unknown> {
    return this.gameCatalogService.getUserStats(userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get game by slug' })
  @ApiResponse({ status: 200, description: 'Game details' })
  async getGame(@Param('slug') slug: string): Promise<unknown> {
    return this.gameCatalogService.getGameBySlug(slug);
  }

  @Post(':gameId/start')
  @ApiOperation({ summary: 'Start a game' })
  @ApiResponse({ status: 201, description: 'Game started' })
  async startGame(
    @Param('gameId') gameId: string,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.gameCatalogService.startGame(req.user.id, gameId);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit answer' })
  @ApiResponse({ status: 200, description: 'Answer result' })
  async submitAnswer(
    @Body()
    body: {
      sessionId: string;
      questionId: string;
      answer: string;
      timeTaken: number;
    },
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.gameCatalogService.submitAnswer(
      req.user.id,
      body.sessionId,
      body.questionId,
      body.answer,
      body.timeTaken
    );
  }

  @Post(':sessionId/complete')
  @ApiOperation({ summary: 'Complete game' })
  @ApiResponse({ status: 200, description: 'Game completed' })
  async completeGame(
    @Param('sessionId') sessionId: string,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.gameCatalogService.completeGame(req.user.id, sessionId);
  }
}
