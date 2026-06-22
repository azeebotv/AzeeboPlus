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
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto';

interface AuthenticatedRequest {
  user: {
    sub: string;
  };
}

@ApiTags('Subscriptions')
@Controller('v1/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans(): Promise<any> {
    return this.subscriptionService.getPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanById(@Param('id') id: string): Promise<any> {
    return this.subscriptionService.getPlanById(id);
  }

  @Post('plans')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan (admin)' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto): Promise<any> {
    return this.subscriptionService.createPlan(dto);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async subscribe(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubscribeToPlanDto
  ): Promise<any> {
    return this.subscriptionService.subscribe(req.user.sub, dto);
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentSubscription(@Request() req: AuthenticatedRequest): Promise<any> {
    return this.subscriptionService.getCurrentSubscription(req.user.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<any> {
    return this.subscriptionService.cancelSubscription(req.user.sub, id);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription history' })
  @ApiResponse({ status: 200, description: 'Subscription history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscriptionHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<any> {
    return this.subscriptionService.getSubscriptionHistory(
      req.user.sub,
      Number(page),
      Number(limit)
    );
  }
}
