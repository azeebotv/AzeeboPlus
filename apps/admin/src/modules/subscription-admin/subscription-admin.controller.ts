import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionAdminService } from './subscription-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Subscriptions')
@ApiBearerAuth()
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class SubscriptionAdminController {
  constructor(
    @Inject(SubscriptionAdminService)
    private readonly subscriptionService: SubscriptionAdminService
  ) {}

  private getActorId(req: { user?: { sub: string; id?: string } }): string | undefined {
    return req.user?.id || req.user?.sub;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription stats' })
  async getStats() {
    return this.subscriptionService.getSubscriptionStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get subscription plans with pagination & filtering' })
  async getSubscriptionPlans(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('tier') tier?: string
  ) {
    return this.subscriptionService.getSubscriptionPlans({ page, limit, status, tier });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  async getSubscriptionPlanById(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionPlanById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription plan' })
  async createSubscriptionPlan(@Body() body: Record<string, unknown>) {
    return this.subscriptionService.createSubscriptionPlan(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: { user?: { sub: string; id?: string } }
  ) {
    return this.subscriptionService.updateSubscriptionPlan(id, body, this.getActorId(req));
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Toggle subscription plan status' })
  async toggleStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: { user?: { sub: string; id?: string } }
  ) {
    return this.subscriptionService.toggleSubscriptionPlanStatus(
      id,
      body.status,
      this.getActorId(req)
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription plan' })
  async deleteSubscriptionPlan(
    @Param('id') id: string,
    @Req() req: { user?: { sub: string; id?: string } }
  ) {
    return this.subscriptionService.deleteSubscriptionPlan(id, this.getActorId(req));
  }
}
