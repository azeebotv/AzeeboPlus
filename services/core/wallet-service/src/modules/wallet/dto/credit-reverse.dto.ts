import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for crediting back a failed operation (compensation).
 * Used by universe services to reverse a previously debited charge.
 */
export class CreditReverseDto {
  /**
   * The unique identifier of the user whose wallet will be credited back.
   * The wallet is looked up by userId internally.
   */
  @ApiProperty()
  @IsString()
  userId!: string;

  /**
   * The amount to credit back to the wallet.
   * Must be at least 0.01.
   */
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  /**
   * Idempotency key to prevent duplicate credits.
   * Should reference the original charge's idempotency key.
   */
  @ApiProperty()
  @IsString()
  idempotencyKey!: string;

  /**
   * Human-readable description of the credit reversal.
   */
  @ApiProperty()
  @IsString()
  description!: string;

  /**
   * Optional metadata to attach to the reversal transaction.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
