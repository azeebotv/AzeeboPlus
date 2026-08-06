import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { MessagingService } from './messaging.service.js';
import { CreateConversationDto, SendMessageDto, MarkAsReadDto } from './dto/messaging.dto.js';
import { RateLimitGuard, RateLimit, ServiceAuthGuard } from '@azeebo/security';
import { User } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messaging')
@UseGuards(RateLimitGuard, ServiceAuthGuard)
export class MessagingController {
  constructor(@Inject(MessagingService) private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@Request() req: AuthRequest) {
    return this.messagingService.getConversations(req.user.id);
  }

  @Get('conversations/search')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Search conversations' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchConversations(
    @Request() req: AuthRequest,
    @Query('q') query: string,
    @Query('limit') limit = 20
  ) {
    return this.messagingService.searchConversations(req.user.id, query, Number(limit));
  }

  @Get('conversations/:conversationId/messages')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0
  ) {
    return this.messagingService.getMessages(
      req.user.id,
      conversationId,
      Number(limit),
      Number(offset)
    );
  }

  @Get('messages/search')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Search messages' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchMessages(
    @Request() req: AuthRequest,
    @Query('q') query: string,
    @Query('limit') limit = 20
  ) {
    return this.messagingService.searchMessages(req.user.id, query, Number(limit));
  }

  @Post('conversations')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createConversation(@Request() req: AuthRequest, @Body() dto: CreateConversationDto) {
    return this.messagingService.createConversation(req.user.id, dto);
  }

  @Put('conversations/:conversationId')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Update conversation settings' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  async updateConversation(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() body: { name?: string; avatar?: string }
  ) {
    return this.messagingService.updateConversation(req.user.id, conversationId, body);
  }

  @Post('conversations/:conversationId/messages')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto
  ) {
    return this.messagingService.sendMessage(req.user.id, conversationId, dto);
  }

  @Post('conversations/:conversationId/messages/reply')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Reply to a message' })
  @ApiResponse({ status: 201, description: 'Reply sent' })
  async replyToMessage(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() body: { replyToId: string; content: string }
  ) {
    return this.messagingService.replyToMessage(
      req.user.id,
      conversationId,
      body.replyToId,
      body.content
    );
  }

  @Post('conversations/:conversationId/messages/:messageId/react')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'React to a message' })
  @ApiResponse({ status: 200, description: 'Reaction toggled' })
  async addReaction(
    @Request() req: AuthRequest,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string }
  ) {
    return this.messagingService.addReaction(req.user.id, messageId, body.emoji);
  }

  @Get('conversations/:conversationId/messages/:messageId/reactions')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get reactions for a message' })
  @ApiResponse({ status: 200, description: 'Reactions list' })
  async getReactions(@Param('messageId') messageId: string) {
    return this.messagingService.getReactions(messageId);
  }

  @Get('conversations/:conversationId/messages/:messageId/thread')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get message thread (replies)' })
  @ApiResponse({ status: 200, description: 'Thread messages' })
  async getThread(@Param('messageId') messageId: string, @Query('limit') limit = 50) {
    return this.messagingService.getThread(messageId, Number(limit));
  }

  @Put('messages/:messageId')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({ status: 200, description: 'Message edited' })
  async editMessage(
    @Request() req: AuthRequest,
    @Param('messageId') messageId: string,
    @Body() body: { content: string }
  ) {
    return this.messagingService.editMessage(req.user.id, messageId, body.content);
  }

  @Delete('messages/:messageId')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(@Request() req: AuthRequest, @Param('messageId') messageId: string) {
    return this.messagingService.deleteMessage(req.user.id, messageId);
  }

  @Put('messages/:messageId/pin')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Pin/unpin a message' })
  @ApiResponse({ status: 200, description: 'Pin status updated' })
  async pinMessage(
    @Request() req: AuthRequest,
    @Param('messageId') messageId: string,
    @Body() body: { pinned: boolean }
  ) {
    return this.messagingService.pinMessage(req.user.id, messageId, body.pinned);
  }

  @Post('conversations/:conversationId/read')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  async markAsRead(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkAsReadDto
  ) {
    return this.messagingService.markAsRead(req.user.id, conversationId, dto.messageId);
  }

  @Post('conversations/:conversationId/participants')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Add participant to conversation' })
  @ApiResponse({ status: 201, description: 'Participant added' })
  async addParticipant(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() body: { userId: string }
  ) {
    return this.messagingService.addParticipant(req.user.id, conversationId, body.userId);
  }

  @Delete('conversations/:conversationId/participants/:userId')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Remove participant from conversation' })
  @ApiResponse({ status: 200, description: 'Participant removed' })
  async removeParticipant(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string
  ) {
    return this.messagingService.removeParticipant(req.user.id, conversationId, userId);
  }

  @Put('conversations/:conversationId/mute')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Mute/unmute conversation' })
  @ApiResponse({ status: 200, description: 'Mute status updated' })
  async muteConversation(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() body: { muted: boolean }
  ) {
    return this.messagingService.muteConversation(req.user.id, conversationId, body.muted);
  }

  @Put('conversations/:conversationId/archive')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Archive/unarchive conversation' })
  @ApiResponse({ status: 200, description: 'Archive status updated' })
  async archiveConversation(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string,
    @Body() body: { archived: boolean }
  ) {
    return this.messagingService.archiveConversation(req.user.id, conversationId, body.archived);
  }

  @Delete('conversations/:conversationId')
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  async deleteConversation(
    @Request() req: AuthRequest,
    @Param('conversationId') conversationId: string
  ) {
    return this.messagingService.deleteConversation(req.user.id, conversationId);
  }
}
