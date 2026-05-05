import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatorService, ContentItem } from './creator.service';

@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  private getUserIdFromHeader(authorization: string): string {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }
    return authorization.replace('Bearer ', '') || 'user-1';
  }

  @Get('dashboard')
  async getDashboard(
    @Headers('authorization') authorization: string
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    return {
      success: true,
      data: await this.creatorService.getDashboardStats(userId),
    };
  }

  @Get('content')
  async getContent(
    @Headers('authorization') authorization: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    return {
      success: true,
      data: await this.creatorService.getContent(userId, Number(page), Number(limit), status),
    };
  }

  @Post('content')
  async createContent(
    @Headers('authorization') authorization: string,
    @Body() body: { title: string; description: string; type: string }
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    const content = await this.creatorService.createContent(userId, body);
    return {
      success: true,
      data: content,
    };
  }

  @Patch('content/:id')
  async updateContent(
    @Headers('authorization') authorization: string,
    @Param('id') id: string,
    @Body() body: Partial<ContentItem>
  ): Promise<{ success: boolean; data?: unknown; message?: string }> {
    const userId = this.getUserIdFromHeader(authorization);
    const content = await this.creatorService.updateContent(id, userId, body);
    if (!content) {
      return {
        success: false,
        message: 'Content not found',
      };
    }
    return {
      success: true,
      data: content,
    };
  }

  @Delete('content/:id')
  async deleteContent(
    @Headers('authorization') authorization: string,
    @Param('id') id: string
  ): Promise<{ success: boolean; message: string }> {
    const userId = this.getUserIdFromHeader(authorization);
    const deleted = await this.creatorService.deleteContent(id, userId);
    return {
      success: deleted,
      message: deleted ? 'Content deleted' : 'Content not found',
    };
  }

  @Get('analytics')
  async getAnalytics(
    @Headers('authorization') authorization: string,
    @Query('period') period = '30days'
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    return {
      success: true,
      data: await this.creatorService.getAnalytics(userId, period),
    };
  }

  @Get('earnings')
  async getEarnings(
    @Headers('authorization') authorization: string,
    @Query('period') period = 'this-month'
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    return {
      success: true,
      data: await this.creatorService.getEarnings(userId, period),
    };
  }

  @Post('payouts/request')
  async requestPayout(
    @Headers('authorization') authorization: string
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    return {
      success: true,
      data: await this.creatorService.requestPayout(userId),
    };
  }

  @Put('payouts/settings')
  async updatePayoutSettings(
    @Headers('authorization') authorization: string,
    @Body() body: { method: string; minimum: number }
  ): Promise<{ success: boolean; data: unknown }> {
    const userId = this.getUserIdFromHeader(authorization);
    return {
      success: true,
      data: await this.creatorService.updatePayoutSettings(userId, body),
    };
  }
}
