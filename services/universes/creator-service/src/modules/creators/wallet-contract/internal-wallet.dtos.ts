/**
 * Provenance-documented copy of wallet-service's internal wallet DTOs — the
 * source of truth lives at
 * services/core/wallet-service/src/modules/wallet/dto/wallet-operation.dto.ts
 * (classes: InternalDebitWalletDto, InternalCreditWalletDto).
 *
 * WHY A COPY: wallet-service is a standalone NestJS service whose DTO file
 * pulls in the full Nest request pipeline; compiling it inside the
 * contract-tests package is heavier than mirroring these two small classes.
 * The mirror is what the contract suite validates creator-service's real
 * payload builders against — if wallet-service's internal DTOs ever change
 * shape (new required field, renamed key, tightened constraint), the
 * @azeebo/contract-tests suite FAILS until this mirror is updated in the
 * same PR.
 */
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
