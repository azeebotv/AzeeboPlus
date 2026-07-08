import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '@azeebo/security';

@ApiTags('Admin - Wallet Service')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get wallet service statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Wallet service statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWalletStats() {
    return this.adminService.getWalletStats();
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Get all wallets (admin)' })
  @ApiResponse({ status: 200, description: 'List of wallets' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllWallets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('currency') currency?: string
  ) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.adminService.getAllWallets({ page, limit: clampedLimit, currency });
  }

  @Get('wallets/:walletId')
  @ApiOperation({ summary: 'Get wallet details (admin)' })
  @ApiResponse({ status: 200, description: 'Wallet details' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWalletById(@Param('walletId') walletId: string) {
    return this.adminService.getWalletById(walletId);
  }

  @Get('wallets/user/:userId')
  @ApiOperation({ summary: 'Get wallet by user ID (admin)' })
  @ApiResponse({ status: 200, description: 'Wallet details' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWalletByUserId(@Param('userId') userId: string) {
    return this.adminService.getWalletByUserId(userId);
  }

  @Get('wallets/:walletId/transactions')
  @ApiOperation({ summary: 'Get wallet transactions (admin)' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getWalletTransactions(
    @Param('walletId') walletId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string
  ) {
    const clampedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.adminService.getTransactionsByWalletId(walletId, { page, limit: clampedLimit, type });
  }
}
