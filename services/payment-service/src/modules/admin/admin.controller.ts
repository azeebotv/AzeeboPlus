import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Payment Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Payment statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentStats() {
    return this.adminService.getPaymentStats();
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments (admin)' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getPayments({ page, limit, status });
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get payment by ID (admin)' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentById(@Param('paymentId') paymentId: string) {
    return this.adminService.getPaymentById(paymentId);
  }

  @Get('payment-intents')
  @ApiOperation({ summary: 'Get all payment intents (admin)' })
  @ApiResponse({ status: 200, description: 'List of payment intents' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentIntents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getPaymentIntents({ page, limit, status });
  }

  @Get('refunds')
  @ApiOperation({ summary: 'Get all refunds (admin)' })
  @ApiResponse({ status: 200, description: 'List of refunds' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRefunds(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.adminService.getRefunds({ page, limit, status });
  }

  @Get('webhook-events')
  @ApiOperation({ summary: 'Get webhook events (admin)' })
  @ApiResponse({ status: 200, description: 'List of webhook events' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWebhookEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('provider') provider?: string
  ) {
    return this.adminService.getWebhookEvents({ page, limit, provider });
  }
}
