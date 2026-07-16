import { IsNumber, IsPositive, Min, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data transfer object for adding bonus credits to a wallet.
 * Used for promotional bonuses, rewards, or other non-purchase credits.
 */
export class AddBonusCreditDto {
  /**
   * The amount of bonus credit to add.
   * Must be a positive number.
   */
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @Transform(({ value }) => Number(value))
  amount!: number;

  /**
   * The reason for the bonus credit.
   * Must be at least 5 characters long.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
