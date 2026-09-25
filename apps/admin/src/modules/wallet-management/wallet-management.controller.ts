import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
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
    @Inject(WalletManagementService)
    private readonly walletService: WalletManagementService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

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
    await this.auditService.log({
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

  @Get('payouts')
  async getPayoutRequests(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string
  ) {
    return this.walletService.getPayoutRequests(Number(page), Number(limit), status);
  }

  @Put('payouts/:id/approve')
  async approvePayoutRequest(@Param('id') id: string, @Req() req: AuthRequest) {
    const actorId = resolveActorId(req);
    const result = await this.walletService.approvePayoutRequest(id, actorId);
    await this.auditService.log({
      actorId,
      action: 'payout.approved',
      targetType: 'payout_request',
      targetId: id,
      ipAddress: req.ip,
    });
    return result;
  }

  @Put('payouts/:id/reject')
  async rejectPayoutRequest(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: AuthRequest
  ) {
    const actorId = resolveActorId(req);
    const result = await this.walletService.rejectPayoutRequest(id, body?.reason || '', actorId);
    await this.auditService.log({
      actorId,
      action: 'payout.rejected',
      targetType: 'payout_request',
      targetId: id,
      details: { reason: body?.reason },
      ipAddress: req.ip,
    });
    return result;
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
