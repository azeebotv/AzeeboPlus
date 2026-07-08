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
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreatorService, ContentItem } from './creator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('creator')
@Controller('creator')
export class CreatorController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getDashboardStats(req.user.id),
    };
  }

  @Get('content')
  async getContent(
    @Request() req: AuthRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getContent(req.user.id, Number(page), Number(limit), status),
    };
  }

  @Post('content')
  async createContent(
    @Request() req: AuthRequest,
    @Body() body: { title: string; description: string; type: string }
  ): Promise<{ success: boolean; data: unknown }> {
    const content = await this.creatorService.createContent(req.user.id, body);
    return {
      success: true,
      data: content,
    };
  }

  @Patch('content/:id')
  async updateContent(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: Partial<ContentItem>
  ): Promise<{ success: boolean; data?: unknown; message?: string }> {
    const content = await this.creatorService.updateContent(id, req.user.id, body);
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
    @Request() req: AuthRequest,
    @Param('id') id: string
  ): Promise<{ success: boolean; message: string }> {
    const deleted = await this.creatorService.deleteContent(id, req.user.id);
    return {
      success: deleted,
      message: deleted ? 'Content deleted' : 'Content not found',
    };
  }

  @Get('analytics')
  async getAnalytics(
    @Request() req: AuthRequest,
    @Query('period') period = '30days'
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getAnalytics(req.user.id, period),
    };
  }

  @Get('earnings')
  async getEarnings(
    @Request() req: AuthRequest,
    @Query('period') period = 'this-month'
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getEarnings(req.user.id, period),
    };
  }

  @Post('payouts/request')
  async requestPayout(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.requestPayout(req.user.id),
    };
  }

  @Put('payouts/settings')
  async updatePayoutSettings(
    @Request() req: AuthRequest,
    @Body() body: { method: string; minimum: number }
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updatePayoutSettings(req.user.id, body),
    };
  }
}
