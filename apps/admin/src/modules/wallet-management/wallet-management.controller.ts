import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WalletManagementService } from './wallet-management.service';
import { AuditLogService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { resolveActorId } from '../../common/resolve-actor-id';

interface AuthRequest extends Request {
  user: { id?: string; sub?: string; email: string; role: string };
}

@Controller('admin/wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class WalletManagementController {
  constructor(
    @Inject(WalletManagementService) private readonly walletService: WalletManagementService,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService
  ) {}

  /** Manual balance adjustment — credit/debit/correction with ledger entry. */
  @Post(':walletId/adjust')
  async adjustWalletBalance(
    @Param('walletId') walletId: string,
    @Req() req: AuthRequest,
    @Body() body: { amount: number; type: 'credit' | 'debit' | 'correction'; description?: string }
  ) {
    const actorId = resolveActorId(req);
    const result = await this.walletService.adjustWalletBalance(
      walletId,
      Number(body.amount),
      body.type,
      body.description || '',
      actorId
    );
    await this.auditLogService.log({
      actorId,
      action: 'wallet.adjusted',
      targetType: 'wallet',
      targetId: walletId,
      details: { amount: body.amount, type: body.type, reason: body.description },
      ipAddress: req.ip,
    });
    return result;
  }

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

  @Put(':walletId/status')
  async updateWalletStatus(@Param('walletId') walletId: string, @Body('status') status: string) {
    return this.walletService.updateWalletStatus(walletId, status);
  }
}
