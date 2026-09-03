import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, ServiceAuthGuard } from '@azeebo/security';
import { CreatorResponse } from './interfaces/creator-response.interface.js';
import { TippingService } from './tipping.service.js';

interface SendTipBody {
  creatorId: string;
  amount: number;
  message?: string;
}

@ApiTags('Tipping')
@ApiBearerAuth()
@UseGuards(ServiceAuthGuard)
@Controller('tipping')
export class TippingController {
  constructor(
    @Inject(TippingService) private readonly tippingService: TippingService,
  ) {}

  @Get('stats')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get current user tipping stats' })
  @ApiResponse({ status: 200, description: 'User tipping stats (totalTips, totalAmount, topTier)' })
  async getUserTipStats(
    @Request() req: { user: { id: string } },
  ): Promise<CreatorResponse> {
    return this.tippingService.getUserTipStats(req.user.id);
  }

  @Get('history')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get current user tipping history (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated tip history' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 10)' })
  async getUserTipHistory(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<CreatorResponse> {
    return this.tippingService.getUserTipHistory(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Post('send')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Send a tip to a creator' })
  @ApiResponse({ status: 201, description: 'Tip sent successfully' })
  async sendTip(
    @Request() req: { user: { id: string } },
    @Body() body: SendTipBody,
  ): Promise<CreatorResponse> {
    return this.tippingService.sendTip(
      req.user.id,
      body.creatorId,
      body.amount,
      body.message,
    );
  }
}
