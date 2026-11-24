import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';
import { FeatureFlagGuard, FeatureFlag, subscriptionFlags } from '@azeebo/feature-flags';

import { BundleService } from './bundle.service.js';
import { CreateBundleDto } from './dto/create-bundle.dto.js';
import { SubscribeBundleDto } from './dto/subscribe-bundle.dto.js';
import type { BundlePass, BundleSubscription } from '../../prisma/client/index.js';

interface AuthenticatedRequest {
  user: { id: string };
}

@ApiTags('Bundles')
@Controller('subscription/bundles')
export class BundleController {
  constructor(@Inject(BundleService) private readonly bundleService: BundleService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get available bundles' })
  @ApiResponse({ status: 200, description: 'List of bundles' })
  async getBundles(): Promise<BundlePass[]> {
    return this.bundleService.getBundles();
  }

  @Get('compare')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Compare individual vs bundle pricing' })
  @ApiResponse({ status: 200, description: 'Comparison data' })
  async getComparison(): Promise<{
    bundles: BundlePass[];
    individualTotal: number;
    bundleSavings: number;
  }> {
    return this.bundleService.getBundleComparison();
  }

  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bundle subscription' })
  @ApiResponse({ status: 200, description: 'Current bundle subscription' })
  async getCurrentBundle(@Request() req: AuthenticatedRequest): Promise<BundleSubscription | null> {
    return this.bundleService.getCurrentBundle(req.user.id);
  }

  @Get(':id/quote')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get prorated upgrade quote for a bundle' })
  @ApiResponse({ status: 200, description: 'Prorated upgrade quote with credits' })
  async getUpgradeQuote(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bundleService.getUpgradeQuote(req.user.id, id);
  }

  @Get(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get bundle details' })
  @ApiResponse({ status: 200, description: 'Bundle details' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  async getBundleById(@Param('id') id: string): Promise<BundlePass> {
    return this.bundleService.getBundleById(id);
  }

  @Post()
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a bundle (admin only)' })
  @ApiResponse({ status: 201, description: 'Bundle created' })
  async createBundle(@Body() dto: CreateBundleDto): Promise<BundlePass> {
    return this.bundleService.createBundle(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a bundle (admin only)' })
  @ApiResponse({ status: 200, description: 'Bundle updated' })
  async updateBundle(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBundleDto>
  ): Promise<BundlePass> {
    return this.bundleService.updateBundle(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a bundle (admin only)' })
  @ApiResponse({ status: 200, description: 'Bundle deleted' })
  async deleteBundle(@Param('id') id: string): Promise<{ message: string }> {
    await this.bundleService.deleteBundle(id);
    return { message: 'Bundle deleted successfully' };
  }

  @Post(':id/subscribe')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(subscriptionFlags.bundles)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a bundle' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async subscribe(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubscribeBundleDto
  ): Promise<BundleSubscription> {
    return this.bundleService.subscribe(req.user.id, id, dto);
  }

  @Delete(':id/cancel')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(subscriptionFlags.bundles)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a bundle subscription' })
  @ApiResponse({ status: 200, description: 'Cancelled' })
  async cancelSubscription(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<BundleSubscription> {
    return this.bundleService.cancelSubscription(req.user.id, id);
  }
}
