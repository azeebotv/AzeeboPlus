import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsPositive,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * The bank account shape the web client nests under `bankDetails`.
 * Everything is optional: this is a description of the payout destination, not
 * a record the service trusts on its own.
 */
export class BankDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountName?: string;
}

export interface WithdrawalDestination {
  bankAccountId?: string;
  bankCode?: string;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
}

/**
 * Collapses the three destination shapes the clients actually send into one
 * record: `{ bankAccountId }`, `{ bankCode, accountNumber }` (mobile) and
 * `{ bankDetails: { ... } }` (web). Returns `null` when the caller named no
 * destination at all, which is the only case the service rejects.
 */
export function resolveWithdrawalDestination(dto: {
  bankAccountId?: string;
  bankCode?: string;
  accountNumber?: string;
  bankDetails?: BankDetailsDto | null;
}): WithdrawalDestination | null {
  const details = dto.bankDetails ?? {};
  const destination: WithdrawalDestination = {};

  if (dto.bankAccountId) destination.bankAccountId = dto.bankAccountId;

  const accountNumber = dto.accountNumber ?? details.accountNumber;
  const bankCode = dto.bankCode ?? details.bankCode ?? details.bankName;
  if (accountNumber) destination.accountNumber = accountNumber;
  if (bankCode) destination.bankCode = bankCode;
  if (details.bankName) destination.bankName = details.bankName;
  if (details.accountName) destination.accountName = details.accountName;

  return destination.bankAccountId || destination.accountNumber ? destination : null;
}

export class WithdrawWalletDto {
  /**
   * Client-generated key that is stable across retries. Prevents duplicate
   * withdrawals when a request times out and is replayed. The shared
   * http-client also sends it as the Idempotency-Key header; either source
   * satisfies the guard, but the body key is required so every client
   * acknowledges the contract explicitly (AUD-03).
   */
  @ApiProperty({ example: 'withdraw-0b9e6c1e-2b7a-4f3d-9c1a-8f2e7d6c5b4a' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number;

  /**
   * One of three destination shapes must be supplied; `resolveWithdrawalDestination`
   * normalizes them and the service rejects a request that names none. Declaring
   * all of them keeps `forbidNonWhitelisted` from rejecting the mobile shape
   * (`bankCode` + `accountNumber`) and the web shape (`bankDetails`).
   */
  @ApiPropertyOptional({ example: 'bank-account-123' })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional({ example: '058' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ type: BankDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ example: 'Withdrawal to bank account' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransferWalletDto {
  /**
   * Client-generated key that is stable across retries. Prevents duplicate
   * transfers when a request times out and is replayed. The shared
   * http-client also sends it as the Idempotency-Key header; either source
   * satisfies the guard, but the body key is required so every client
   * acknowledges the contract explicitly (AUD-03).
   */
  @ApiProperty({ example: 'transfer-0b9e6c1e-2b7a-4f3d-9c1a-8f2e7d6c5b4a' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

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
