import { IsString, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WithdrawWalletDto {
  /**
   * Client-generated key that is stable across retries. Prevents duplicate
   * withdrawals when a request times out and is replayed. May also be
   * supplied via the Idempotency-Key header (sent automatically by the
   * shared http-client); falls back to a server-generated unique key.
   */
  @ApiPropertyOptional({ example: 'withdraw-0b9e6c1e-2b7a-4f3d-9c1a-8f2e7d6c5b4a' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'bank-account-123' })
  @IsString()
  bankAccountId!: string;

  @ApiPropertyOptional({ example: 'Withdrawal to bank account' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransferWalletDto {
  /**
   * Client-generated key that is stable across retries. Prevents duplicate
   * transfers when a request times out and is replayed. May also be
   * supplied via the Idempotency-Key header (sent automatically by the
   * shared http-client); falls back to a server-generated unique key.
   */
  @ApiPropertyOptional({ example: 'transfer-0b9e6c1e-2b7a-4f3d-9c1a-8f2e7d6c5b4a' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'user-456' })
  @IsString()
  recipientId!: string;

  @ApiPropertyOptional({ example: 'Transfer for services' })
  @IsString()
  @IsOptional()
  description?: string;
}
