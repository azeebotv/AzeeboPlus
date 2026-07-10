import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WalletManagementService } from './wallet-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class WalletManagementController {
  constructor(private readonly walletService: WalletManagementService) {}

  @Get()
  async getWallets(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.walletService.getWallets(Number(page), Number(limit));
  }

  @Get('stats')
  async getWalletStats() {
    return this.walletService.getWalletStats();
  }

  @Get(':id/transactions')
  async getWalletTransactions(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return this.walletService.getWalletTransactions(id, Number(page), Number(limit));
  }
}
