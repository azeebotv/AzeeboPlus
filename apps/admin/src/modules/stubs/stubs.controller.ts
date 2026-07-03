import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class StubsController {
  @Get('wallets')
  async getWallets(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return { items: [], total: 0, page: Number(page), limit: Number(limit), hasMore: false };
  }

  @Get('wallets/stats')
  async getWalletStats() {
    return { totalWallets: 0, totalBalance: 0, totalBonus: 0, totalPromo: 0, todayTransactions: 0 };
  }

  @Get('wallets/:id/transactions')
  async getWalletTransactions(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return { items: [], total: 0, page: Number(page), limit: Number(limit), hasMore: false };
  }

  @Put('wallets/:walletId/status')
  async updateWalletStatus(@Param('walletId') walletId: string, @Body() body: { status: string }) {
    return { walletId, status: body.status, message: 'Wallet status updated' };
  }

  @Get('payment-gateways')
  async getPaymentGateways() {
    return [
      { id: 'paystack', name: 'Paystack', isEnabled: true, mode: 'live' },
      { id: 'flutterwave', name: 'Flutterwave', isEnabled: false, mode: 'test' },
    ];
  }

  @Put('payment-gateways/:id/toggle')
  async togglePaymentGateway(@Param('id') id: string, @Body() body: { isEnabled: boolean }) {
    return { id, isEnabled: body.isEnabled, message: 'Gateway toggled' };
  }

  @Put('payment-gateways/:id/mode')
  async updatePaymentGatewayMode(@Param('id') id: string, @Body() body: { mode: string }) {
    return { id, mode: body.mode, message: 'Gateway mode updated' };
  }

  @Get('reality-shows')
  async getRealityShows(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return { items: [], total: 0, page: Number(page), limit: Number(limit), hasMore: false };
  }

  @Put('reality-shows/:id/status')
  async updateRealityShowStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return { id, status: body.status, message: 'Show status updated' };
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string
  ) {
    return { logs: [], total: 0, page: Number(page), limit: Number(limit), totalPages: 0 };
  }

  @Get('audit-logs/actor/:actorId')
  async getAuditLogsByActor(
    @Param('actorId') actorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return { logs: [], total: 0, page: Number(page), limit: Number(limit), totalPages: 0 };
  }

  @Get('audit-logs/target/:targetType/:targetId')
  async getAuditLogsByTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return { logs: [], total: 0, page: Number(page), limit: Number(limit), totalPages: 0 };
  }

  @Get('notification-templates')
  async getNotificationTemplates() {
    return [];
  }

  @Post('notification-templates')
  async createNotificationTemplate(@Body() body: { name: string; type: string; subject: string; content: string }) {
    return { id: 'nt-' + Date.now(), ...body, isActive: true, createdAt: new Date().toISOString() };
  }

  @Put('notification-templates/:id')
  async updateNotificationTemplate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id, ...body, updatedAt: new Date().toISOString() };
  }

  @Get('reports')
  async getReports(@Query('range') range: string = '30d') {
    return [];
  }

  @Post('reports')
  async createReport(@Body() body: Record<string, unknown>) {
    return { id: 'rpt-' + Date.now(), ...body, createdAt: new Date().toISOString() };
  }

  @Post('reports/execute')
  async executeReport(@Body() body: { reportId: string }) {
    return { reportId: body.reportId, executedAt: new Date().toISOString(), rowCount: 0 };
  }

  @Delete('reports/:id')
  async deleteReport(@Param('id') id: string) {
    return { message: 'Report deleted', id };
  }
}
