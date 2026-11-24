import { IsNumber, IsPositive, Min, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for funding a wallet.
 * Used when a user wants to add funds to their wallet balance.
 */
export class FundWalletDto {
  /**
   * The amount to fund the wallet with.
   * Must be a positive number.
   */
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number;

  /**
   * Optional reference identifier for the transaction.
   * Can be used to track the payment externally.
   */
  @IsString()
  @IsOptional()
  reference?: string;

  /**
   * Accepted, not stored as a decision: every shipped caller names the
   * provider (`walletApi.fundWallet({ amount, provider, email })`) or the
   * method (`api.wallet.fundWallet(amount, paymentMethod)`), while the pending
   * transaction is settled by whoever confirms it. They are recorded on the
   * transaction for reconciliation, and declaring them stops
   * `forbidNonWhitelisted` from 400-ing the wallet funding screen.
   */
  @ApiPropertyOptional({ description: 'Payment provider selected by the client' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Payment method label (alias for provider)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Payer email (identity comes from the JWT)' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
