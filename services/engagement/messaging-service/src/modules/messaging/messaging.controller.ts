import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { MessagingService } from './messaging.service';
import { CreateConversationDto, SendMessageDto, MarkAsReadDto } from './dto/messaging.dto';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { User } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: User;
}

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('v1/messaging')
@UseGuards(AuthGuard('jwt'), RateLimitGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@Request() req: AuthRequest) {
    return this.messagingService.getConversations(req.user.id);
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

  @Post('conversations')
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createConversation(@Request() req: AuthRequest, @Body() dto: CreateConversationDto) {
    return this.messagingService.createConversation(req.user.id, dto);
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
