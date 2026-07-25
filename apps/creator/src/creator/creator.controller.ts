import {
  Inject,
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
@Roles('creator', 'admin', 'superadmin')
@Controller('creator')
export class CreatorController {
  constructor(@Inject(CreatorService) private readonly creatorService: CreatorService) {}

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
  ): Promise<{ success: boolean; data: unknown }> {
    const content = await this.creatorService.updateContent(id, req.user.id, body);
    return {
      success: true,
      data: content,
    };
  }

  @Delete('content/:id')
  async deleteContent(
    @Request() req: AuthRequest,
    @Param('id') id: string
  ): Promise<{ success: boolean; data: { deleted: true } }> {
    await this.creatorService.deleteContent(id, req.user.id);
    return {
      success: true,
      data: { deleted: true },
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

  @Get('settings')
  async getSettings(@Request() req: AuthRequest): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.getSettings(req.user.id),
    };
  }

  @Put('settings')
  async updateSettings(
    @Request() req: AuthRequest,
    @Body()
    body: {
      payoutMethod?: string;
      minimumPayout?: number;
      notifications?: { email: boolean; push: boolean; sms: boolean; marketing: boolean };
      privacy?: { profileVisibility: string; showEarnings: boolean; allowMessages: boolean };
    }
  ): Promise<{ success: boolean; data: unknown }> {
    return {
      success: true,
      data: await this.creatorService.updateSettings(req.user.id, body),
    };
  }
}
