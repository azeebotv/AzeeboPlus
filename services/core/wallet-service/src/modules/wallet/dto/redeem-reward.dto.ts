import { IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data transfer object for redeeming loyalty points.
 * Used when a user wants to convert reward points to bonus wallet balance.
 */
export class RedeemRewardDto {
  /**
   * The number of loyalty points to redeem.
   * Points are converted to monetary value using the configured exchange rate.
   */
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  points!: number;
}
