import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, InternalSecretGuard, RateLimitGuard, RateLimit } from '@azeebo/security';
import { WalletService } from '../wallet/wallet.service.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  InternalDebitWalletDto,
  InternalCreditWalletDto,
} from '../wallet/dto/wallet-operation.dto.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

/**
 * Service-to-service wallet surface.
 *
 * These endpoints carry no user identity: the caller is a trusted internal
 * service acting on behalf of users (tips, premium subscriptions). Auth is
 * the shared internal secret (x-internal-api-key), enforced by
 * InternalSecretGuard. @Public() opts the routes out of the global
 * ServiceAuthGuard, which would otherwise require gateway-forwarded user
 * headers or a user JWT that a machine call can never present.
 */
@ApiTags('Internal - Wallet Service')
@Controller('internal/wallets')
@Public()
@UseGuards(InternalSecretGuard)
export class InternalWalletController {
  constructor(
    @Inject(WalletService) private readonly walletService: WalletService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  /** Look up a user's wallet by userId (auto-creates with 0 balance if absent). */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get wallet by user ID (internal service-to-service)' })
  async getWalletByUserId(@Param('userId') userId: string) {
    const balance = (await this.walletService.getBalance(userId)) as {
      data?: Record<string, unknown>;
    };
    const wallet = await this.findWalletByUserId(userId);
    return ApiResponseWrapper.success({
      id: wallet?.id,
      userId,
      ...(balance.data ?? {}),
    });
  }

  /** Debit a user's wallet by userId. Same idempotency semantics as /v1/wallet/debit. */
  @Post('user/:userId/debit')
  @UseGuards(RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Debit wallet by user ID (internal service-to-service)' })
  async debitByUserId(@Param('userId') userId: string, @Body() body: InternalDebitWalletDto) {
    const wallet = await this.findWalletByUserId(userId);
    const result = await this.walletService.debitBalance(
      wallet.id,
      body.amount,
      body.description,
      body.reference,
      body.idempotencyKey
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  /** Credit a user's wallet by userId (also used for tip compensation). */
  @Post('user/:userId/credit')
  @UseGuards(RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Credit wallet by user ID (internal service-to-service)' })
  async creditByUserId(@Param('userId') userId: string, @Body() body: InternalCreditWalletDto) {
    const wallet = await this.findWalletByUserId(userId);
    const result = await this.walletService.creditBalance(
      wallet.id,
      body.amount,
      body.description,
      body.idempotencyKey
    );
    return ApiResponseWrapper.success((result as { data: unknown }).data);
  }

  /** Fails with NotFoundException when no wallet exists (never auto-creates). */
  private async findWalletByUserId(userId: string): Promise<{ id: string }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }
    return wallet;
  }
}
