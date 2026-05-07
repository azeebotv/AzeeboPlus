import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TournamentService } from './tournament.service';

@ApiTags('Tournament')
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Get()
  @ApiOperation({ summary: 'Get tournaments' })
  @ApiResponse({ status: 200, description: 'Tournaments list' })
  async getTournaments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.tournamentService.getTournaments(Number(page), Number(limit), status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by id' })
  @ApiResponse({ status: 200, description: 'Tournament details' })
  async getTournament(@Param('id') id: string): Promise<unknown> {
    return this.tournamentService.getTournamentById(id);
  }

  @Post(':id/enter')
  @ApiOperation({ summary: 'Enter tournament' })
  @ApiResponse({ status: 201, description: 'Entered' })
  async enterTournament(
    @Param('id') tournamentId: string,
    @Body() body: { userId: string; initialScore?: number }
  ): Promise<unknown> {
    return this.tournamentService.enterTournament(body.userId, tournamentId, body.initialScore);
  }

  @Post(':id/score')
  @ApiOperation({ summary: 'Update score' })
  @ApiResponse({ status: 200, description: 'Score updated' })
  async updateScore(
    @Param('id') tournamentId: string,
    @Body() body: { userId: string; score: number }
  ): Promise<unknown> {
    return this.tournamentService.updateScore(body.userId, tournamentId, body.score);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard' })
  async getLeaderboard(
    @Param('id') tournamentId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50
  ): Promise<unknown> {
    return this.tournamentService.getLeaderboard(tournamentId, Number(page), Number(limit));
  }

  @Get(':id/rank/:userId')
  @ApiOperation({ summary: 'Get user rank' })
  @ApiResponse({ status: 200, description: 'User rank' })
  async getUserRank(
    @Param('id') tournamentId: string,
    @Param('userId') userId: string
  ): Promise<unknown> {
    return this.tournamentService.getUserRank(userId, tournamentId);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End tournament (admin)' })
  @ApiResponse({ status: 200, description: 'Tournament ended' })
  async endTournament(@Param('id') tournamentId: string): Promise<unknown> {
    return this.tournamentService.endTournament(tournamentId);
  }
}
