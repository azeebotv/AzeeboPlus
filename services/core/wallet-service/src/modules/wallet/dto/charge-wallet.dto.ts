import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for charging a wallet (atomic debit operation).
 * Used by universe services to perform debit-check-entity-rollback in a single call.
 */
export class ChargeWalletDto {
  /**
   * The unique identifier of the user whose wallet will be charged.
   * The wallet is looked up by userId internally.
   */
  @ApiProperty()
  @IsString()
  userId!: string;

  /**
   * The amount to charge from the wallet.
   * Must be at least 0.01.
   */
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  /**
   * Idempotency key to prevent duplicate charges.
   * Required for safe retries.
   */
  @ApiProperty()
  @IsString()
  idempotencyKey!: string;

  /**
   * Human-readable description of the charge.
   */
  @ApiProperty()
  @IsString()
  description!: string;

  /**
   * Optional metadata to attach to the transaction.
   * Useful for tracking related entity IDs, universe info, etc.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
