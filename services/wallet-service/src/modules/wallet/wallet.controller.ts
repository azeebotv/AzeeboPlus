import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  Query,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../database/prisma.service';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { AddBonusCreditDto } from './dto/add-bonus-credit.dto';
import { AddPromoCreditDto } from './dto/add-promo-credit.dto';
import { DebitWalletDto, CreditWalletDto } from './dto/wallet-operation.dto';
import { WithdrawWalletDto, TransferWalletDto } from './dto/withdraw-transfer.dto';
import { WalletResponse } from './interfaces/wallet-response.interface';

interface AuthenticatedRequest {
  user: {
    sub: string;
  };
}

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Request() req: AuthenticatedRequest): Promise<WalletResponse> {
    return this.walletService.getBalance(req.user.sub);
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string
  ): Promise<WalletResponse> {
    return this.walletService.getTransactions(req.user.sub, Number(page), Number(limit), cursor);
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get wallet summary widget' })
  @ApiResponse({ status: 200, description: 'Wallet summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(@Request() req: AuthenticatedRequest): Promise<WalletResponse> {
    return this.walletService.getSummary(req.user.sub);
  }

  @Post('fund')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Initialize wallet funding' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async fundWallet(
    @Request() req: AuthenticatedRequest,
    @Body() fundWalletDto: FundWalletDto
  ): Promise<WalletResponse> {
    return this.walletService.initializeFunding(req.user.sub, fundWalletDto);
  }

  @Post('redeem-reward')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Convert reward points to wallet balance' })
  @ApiResponse({ status: 200, description: 'Reward redeemed' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async redeemReward(
    @Request() req: AuthenticatedRequest,
    @Body() redeemRewardDto: RedeemRewardDto
  ): Promise<WalletResponse> {
    return this.walletService.redeemReward(req.user.sub, redeemRewardDto.points);
  }

  @Post('bonus-credit')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Add bonus credit to wallet' })
  @ApiResponse({ status: 200, description: 'Bonus credit added' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addBonusCredit(
    @Request() req: AuthenticatedRequest,
    @Body() addBonusCreditDto: AddBonusCreditDto
  ): Promise<WalletResponse> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: req.user.sub },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${req.user.sub}`);
    }

    return this.walletService.addBonusCredit(
      wallet.id,
      addBonusCreditDto.amount,
      addBonusCreditDto.reason
    );
  }

  @Post('promo-credit')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Add promo credit to wallet' })
  @ApiResponse({ status: 200, description: 'Promo credit added' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addPromoCredit(
    @Request() req: AuthenticatedRequest,
    @Body() addPromoCreditDto: AddPromoCreditDto
  ): Promise<WalletResponse> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: req.user.sub },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${req.user.sub}`);
    }

    return this.walletService.addPromoCredit(
      wallet.id,
      addPromoCreditDto.amount,
      addPromoCreditDto.promoCode,
      new Date(addPromoCreditDto.expiresAt)
    );
  }

  @Get('audit-trail')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transaction audit trail' })
  @ApiResponse({ status: 200, description: 'Audit trail' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuditTrail(
    @Request() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<WalletResponse> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: req.user.sub },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${req.user.sub}`);
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.walletService.getTransactionAuditTrail(wallet.id, start, end);
  }

  @Post('debit')
  @UseGuards(RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Debit wallet (service-to-service)' })
  @ApiResponse({ status: 200, description: 'Wallet debited' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  async debitWallet(@Body() body: DebitWalletDto): Promise<WalletResponse> {
    return this.walletService.debitBalance(
      body.walletId,
      body.amount,
      body.description,
      undefined,
      body.idempotencyKey
    );
  }

  @Post('credit')
  @UseGuards(RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Credit wallet (service-to-service)' })
  @ApiResponse({ status: 200, description: 'Wallet credited' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async creditWallet(@Body() body: CreditWalletDto): Promise<WalletResponse> {
    return this.walletService.creditBalance(
      body.walletId,
      body.amount,
      body.description,
      body.idempotencyKey
    );
  }

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(5, 3600000)
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  @ApiResponse({ status: 200, description: 'Withdrawal initiated' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async withdraw(
    @Request() req: AuthenticatedRequest,
    @Body() withdrawDto: WithdrawWalletDto
  ): Promise<WalletResponse> {
    return this.walletService.withdraw(req.user.sub, withdrawDto);
  }

  @Post('transfer')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @RateLimit(10, 3600000)
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiResponse({ status: 200, description: 'Transfer completed' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async transfer(
    @Request() req: AuthenticatedRequest,
    @Body() transferDto: TransferWalletDto
  ): Promise<WalletResponse> {
    return this.walletService.transfer(req.user.sub, transferDto);
  }

  @Get('transactions/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<WalletResponse> {
    return this.walletService.getTransaction(req.user.sub, id);
  }
}
