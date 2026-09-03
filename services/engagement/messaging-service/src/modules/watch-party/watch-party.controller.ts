import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WatchPartyService, CreatePartyDto, PlaybackState } from './watch-party.service.js';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

class CreatePartyBodyDto {
  @IsString()
  contentId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(20)
  maxParticipants?: number;
}

class JoinPartyBodyDto {
  @IsString()
  inviteCode!: string;
}

class UpdatePlaybackBodyDto {
  @IsOptional()
  isPlaying?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2)
  playbackRate?: number;
}

class ChatMessageBodyDto {
  @IsString()
  content!: string;
}

@ApiTags('Watch Parties')
@Controller('watch-parties')
@UseGuards(RateLimitGuard)
export class WatchPartyController {
  constructor(private readonly partyService: WatchPartyService) {}

  @Post()
  @RateLimit(5, 60000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a watch party' })
  @ApiResponse({ status: 201, description: 'Party created' })
  async createParty(
    @Request() req: { user: { id: string } },
    @Body() dto: CreatePartyBodyDto,
  ) {
    const party = await this.partyService.createParty(req.user.id, dto);
    return { success: true, data: party };
  }

  @Post('join')
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a watch party' })
  @ApiResponse({ status: 200, description: 'Joined party' })
  @ApiResponse({ status: 404, description: 'Party not found' })
  async joinParty(
    @Request() req: { user: { id: string } },
    @Body() dto: JoinPartyBodyDto,
  ) {
    const party = await this.partyService.joinParty(req.user.id, dto.inviteCode);
    return { success: true, data: party };
  }

  @Get('my')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get user active parties' })
  @ApiResponse({ status: 200, description: 'Active parties' })
  async getMyParties(@Request() req: { user: { id: string } }) {
    const parties = await this.partyService.getUserParties(req.user.id);
    return { success: true, data: parties };
  }

  @Get(':partyId')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get party details' })
  @ApiResponse({ status: 200, description: 'Party details' })
  async getParty(@Param('partyId') partyId: string) {
    const party = await this.partyService.getParty(partyId);
    return { success: true, data: party };
  }

  @Post(':partyId/playback')
  @RateLimit(60, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update playback state' })
  @ApiResponse({ status: 200, description: 'Playback updated' })
  async updatePlayback(
    @Request() req: { user: { id: string } },
    @Param('partyId') partyId: string,
    @Body() dto: UpdatePlaybackBodyDto,
  ) {
    const state = await this.partyService.updatePlayback(req.user.id, partyId, dto);
    return { success: true, data: state };
  }

  @Post(':partyId/sync')
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync all participants to host position' })
  @ApiResponse({ status: 200, description: 'Sync triggered' })
  async syncParticipants(
    @Request() req: { user: { id: string } },
    @Param('partyId') partyId: string,
  ) {
    await this.partyService.syncParticipants(req.user.id, partyId);
    return { success: true };
  }

  @Post(':partyId/chat')
  @RateLimit(30, 60000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send chat message in party' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendChatMessage(
    @Request() req: { user: { id: string } },
    @Param('partyId') partyId: string,
    @Body() dto: ChatMessageBodyDto,
  ) {
    const message = await this.partyService.sendChatMessage(req.user.id, partyId, dto.content);
    return { success: true, data: message };
  }

  @Get(':partyId/chat')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get party chat history' })
  @ApiResponse({ status: 200, description: 'Chat history' })
  async getChatHistory(@Param('partyId') partyId: string) {
    const messages = await this.partyService.getChatHistory(partyId);
    return { success: true, data: messages };
  }

  @Post(':partyId/leave')
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a watch party' })
  @ApiResponse({ status: 200, description: 'Left party' })
  async leaveParty(
    @Request() req: { user: { id: string } },
    @Param('partyId') partyId: string,
  ) {
    await this.partyService.leaveParty(req.user.id, partyId);
    return { success: true };
  }

  @Delete(':partyId')
  @RateLimit(5, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a watch party (host only)' })
  @ApiResponse({ status: 200, description: 'Party ended' })
  async endParty(
    @Request() req: { user: { id: string } },
    @Param('partyId') partyId: string,
  ) {
    await this.partyService.endParty(req.user.id, partyId);
    return { success: true };
  }
}
