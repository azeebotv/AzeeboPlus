import {
  Inject,
  Controller,
  Get,
  Delete,
  Put,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Admin - Messaging Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get messaging service stats (admin)' })
  @ApiResponse({ status: 200, description: 'Messaging service stats' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats() {
    const stats = await this.adminService.getStats();
    return ApiResponseWrapper.success(stats);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get paginated conversations (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated conversations' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getConversations(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getConversations({ page, limit });
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get paginated messages for a conversation (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated messages' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.adminService.getMessages(conversationId, { page, limit });
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get all messages (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'All messages' })
  async getAllMessages(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllMessages({ page, limit });
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation (admin)' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  async deleteConversation(@Param('id') id: string) {
    return this.adminService.deleteConversation(id);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Update conversation (admin)' })
  async updateConversation(
    @Param('id') id: string,
    @Body() body: { name?: string; isMuted?: boolean; isArchived?: boolean }
  ) {
    return this.adminService.updateConversation(id, body);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message (admin)' })
  async deleteMessage(@Param('id') id: string) {
    return this.adminService.deleteMessage(id);
  }
}
