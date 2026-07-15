import { IsNumber, IsPositive, Min, IsString, IsOptional } from 'class-validator';

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
}
