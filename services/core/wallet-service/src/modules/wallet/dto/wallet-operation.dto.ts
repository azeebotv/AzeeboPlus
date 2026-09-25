import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for debiting a wallet (service-to-service operation).
 * Used when deducting funds from a user's wallet balance.
 */
export class DebitWalletDto {
  /**
   * The unique identifier of the wallet to debit.
   */
  @ApiProperty()
  @IsString()
  walletId!: string;

  /**
   * The amount to debit from the wallet.
   * Must be at least 0.01.
   */
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  /**
   * Description of the debit transaction.
   * Provides context for the transaction.
   */
  @ApiProperty()
  @IsString()
  description!: string;

  /**
   * Optional reference for the debit (e.g. an external ledger identifier).
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  /**
   * Optional idempotency key to prevent duplicate transactions.
   * If provided, ensures the same transaction is not processed twice.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

/**
 * Data transfer object for crediting a wallet (service-to-service operation).
 * Used when adding funds to a user's wallet balance.
 */
export class CreditWalletDto {
  /**
   * The unique identifier of the wallet to credit.
   */
  @ApiProperty()
  @IsString()
  walletId!: string;

  /**
   * The amount to credit to the wallet.
   * Must be at least 0.01.
   */
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  /**
   * Description of the credit transaction.
   * Provides context for the transaction.
   */
  @ApiProperty()
  @IsString()
  description!: string;

  /**
   * Optional idempotency key to prevent duplicate transactions.
   * If provided, ensures the same transaction is not processed twice.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

/**
 * Debit addressed by user ID — for the internal service-to-service surface
 * (`POST /internal/wallets/user/:userId/debit`). The wallet is resolved from
 * the URL path, so the body carries no walletId (which would otherwise be
 * rejected by the global forbidNonWhitelisted ValidationPipe).
 */
export class InternalDebitWalletDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

/**
 * Credit addressed by user ID — for the internal service-to-service surface
 * (`POST /internal/wallets/user/:userId/credit`). Same rationale as
 * InternalDebitWalletDto.
 */
export class InternalCreditWalletDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
