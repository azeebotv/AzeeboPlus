import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { PollService, CreatePollInput } from './poll.service';

@ApiTags('Polls')
@Controller('polls')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @Get()
  @ApiOperation({ summary: 'List polls' })
  @ApiResponse({ status: 200, description: 'List of polls' })
  async getPolls(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.pollService.getPolls(Number(page) || 1, Number(limit) || 20, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poll details' })
  @ApiResponse({ status: 200, description: 'Poll details' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getPoll(@Param('id') id: string) {
    return this.pollService.getPoll(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a poll' })
  @ApiResponse({ status: 201, description: 'Poll created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPoll(@Request() req: { user: { sub: string } }, @Body() data: CreatePollInput) {
    return this.pollService.createPoll(req.user.sub, data);
  }

  @Post(':id/vote')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote in a poll' })
  @ApiResponse({ status: 200, description: 'Vote recorded' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async votePoll(
    @Request() req: { user: { sub: string } },
    @Param('id') pollId: string,
    @Body() body: { optionId: string }
  ) {
    return this.pollService.votePoll(pollId, req.user.sub, body.optionId);
  }
}
