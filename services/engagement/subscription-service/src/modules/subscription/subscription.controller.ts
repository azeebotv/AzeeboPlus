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
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';

import { SubscriptionService } from './subscription.service.js';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto.js';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto.js';
import type { SubscriptionPlan, Subscription } from '../../prisma/client/index.js';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@ApiTags('Subscriptions')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    @Inject(SubscriptionService) private readonly subscriptionService: SubscriptionService
  ) {}

  @Get('plans')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionService.getPlans();
  }

  @Get('plans/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id') id: string): Promise<SubscriptionPlan> {
    return this.subscriptionService.getPlanById(id);
  }

  @Post('plans')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan (admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.subscriptionService.createPlan(dto);
  }

  @Put('plans/:id')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubscriptionPlanDto>
  ): Promise<SubscriptionPlan> {
    return this.subscriptionService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan deleted' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async deletePlan(@Param('id') id: string): Promise<{ message: string }> {
    await this.subscriptionService.deletePlan(id);
    return { message: 'Plan deleted successfully' };
  }

  @Post('subscribe')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async subscribe(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubscribeToPlanDto
  ): Promise<Subscription> {
    return this.subscriptionService.subscribe(req.user.id, dto);
  }

  @Post('renew/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually renew an active subscription (deducts from wallet)' })
  @ApiResponse({ status: 200, description: 'Subscription renewed' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 400, description: 'Cannot renew' })
  async renewSubscription(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<Subscription> {
    return this.subscriptionService.renewSubscription(req.user.id, id);
  }

  @Get('current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentSubscription(@Request() req: AuthenticatedRequest): Promise<Subscription | null> {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Delete(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<Subscription> {
    return this.subscriptionService.cancelSubscription(req.user.id, id);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription history' })
  @ApiResponse({ status: 200, description: 'Subscription history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscriptionHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{
    subscriptions: Subscription[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));

    return this.subscriptionService.getSubscriptionHistory(req.user.id, safePage, safeLimit);
  }
}
