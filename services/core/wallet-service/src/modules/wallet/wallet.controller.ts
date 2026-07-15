import {
  Inject,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  Query,
  NotFoundException,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';
import { CacheInterceptor, Cache } from '../../cache/index.js';

import { WalletService } from './wallet.service.js';
import { FundWalletDto } from './dto/fund-wallet.dto.js';
import { RedeemRewardDto } from './dto/redeem-reward.dto.js';
import { AddBonusCreditDto } from './dto/add-bonus-credit.dto.js';
import { AddPromoCreditDto } from './dto/add-promo-credit.dto.js';
import { DebitWalletDto, CreditWalletDto } from './dto/wallet-operation.dto.js';
import { WithdrawWalletDto, TransferWalletDto } from './dto/withdraw-transfer.dto.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

interface AuthenticatedRequest {
  user: {
    id: string;
    sub?: string;
    role?: string;
    email?: string;
  };
}

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseInterceptors(CacheInterceptor)
export class WalletController {
  constructor(
    @Inject(WalletService) private readonly walletService: WalletService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Get()
  @Cache({ key: 'wallet:balance', ttl: 60 })
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Request() req: AuthenticatedRequest) {
    const result = await this.walletService.getBalance(req.user.id);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Get('transactions')
  @Cache({ key: 'wallet:transactions', ttl: 60 })
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('cursor') cursor?: string
  ) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    const result = await this.walletService.getTransactions(
      req.user.id,
      Number(page),
      safeLimit,
      cursor
    );
    const data = (result as { data: unknown }).data;
    if (Array.isArray(data)) {
      return ApiResponseWrapper.paginated(data, Number(page), safeLimit, data.length);
    }
    return ApiResponseWrapper.success(data);
  }

  @Get('summary')
  @Cache({ key: 'wallet:summary', ttl: 60 })
  @ApiOperation({ summary: 'Get wallet summary widget' })
  @ApiResponse({ status: 200, description: 'Wallet summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(@Request() req: AuthenticatedRequest) {
    const result = await this.walletService.getSummary(req.user.id);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('fund')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Initialize wallet funding' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async fundWallet(@Request() req: AuthenticatedRequest, @Body() fundWalletDto: FundWalletDto) {
    const result = await this.walletService.initializeFunding(req.user.id, fundWalletDto);
    return ApiResponseWrapper.created((result as { data: unknown }).data);
  }

  @Post('redeem-reward')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Convert reward points to wallet balance' })
  @ApiResponse({ status: 200, description: 'Reward redeemed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async redeemReward(
    @Request() req: AuthenticatedRequest,
    @Body() redeemRewardDto: RedeemRewardDto
  ) {
    const result = await this.walletService.redeemReward(req.user.id, redeemRewardDto.points);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('bonus-credit')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Add bonus credit to wallet' })
  @ApiResponse({ status: 200, description: 'Bonus credit added' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addBonusCredit(
    @Request() req: AuthenticatedRequest,
    @Body() addBonusCreditDto: AddBonusCreditDto
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${req.user.id}`);
    }

    const result = await this.walletService.addBonusCredit(
      wallet.id,
      addBonusCreditDto.amount,
      addBonusCreditDto.reason
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('promo-credit')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Add promo credit to wallet' })
  @ApiResponse({ status: 200, description: 'Promo credit added' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addPromoCredit(
    @Request() req: AuthenticatedRequest,
    @Body() addPromoCreditDto: AddPromoCreditDto
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${req.user.id}`);
    }

    const result = await this.walletService.addPromoCredit(
      wallet.id,
      addPromoCreditDto.amount,
      addPromoCreditDto.promoCode,
      new Date(addPromoCreditDto.expiresAt)
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'Get transaction audit trail' })
  @ApiResponse({ status: 200, description: 'Audit trail' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuditTrail(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: req.user.id },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${req.user.id}`);
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const result = await this.walletService.getTransactionAuditTrail(wallet.id, start, end);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('debit')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Debit wallet (service-to-service)' })
  @ApiResponse({ status: 200, description: 'Wallet debited' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  async debitWallet(@Body() body: DebitWalletDto) {
    const result = await this.walletService.debitBalance(
      body.walletId,
      body.amount,
      body.description,
      undefined,
      body.idempotencyKey
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('credit')
  @UseGuards(AdminGuard, RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Credit wallet (service-to-service)' })
  @ApiResponse({ status: 200, description: 'Wallet credited' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async creditWallet(@Body() body: CreditWalletDto) {
    const result = await this.walletService.creditBalance(
      body.walletId,
      body.amount,
      body.description,
      body.idempotencyKey
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('withdraw')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  @ApiResponse({ status: 200, description: 'Withdrawal initiated' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async withdraw(@Request() req: AuthenticatedRequest, @Body() withdrawDto: WithdrawWalletDto) {
    const result = await this.walletService.withdraw(req.user.id, withdrawDto);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Post('transfer')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiResponse({ status: 200, description: 'Transfer completed' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async transfer(@Request() req: AuthenticatedRequest, @Body() transferDto: TransferWalletDto) {
    const result = await this.walletService.transfer(req.user.id, transferDto);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.walletService.getTransaction(req.user.id, id);
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }
}
