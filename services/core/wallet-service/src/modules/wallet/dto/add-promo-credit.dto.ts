import { IsNumber, IsPositive, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data transfer object for adding promotional credits to a wallet.
 * Used when applying promo codes that add time-limited credits.
 */
export class AddPromoCreditDto {
  /**
   * The amount of promo credit to add.
   * Must be a positive number.
   */
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  amount!: number;

  /**
   * The promo code being redeemed.
   * Used for tracking and validation purposes.
   */
  @IsString()
  @IsNotEmpty()
  promoCode!: string;

  /**
   * The expiration date of the promo credit.
   * Must be a valid ISO date string.
   */
  @IsDateString()
  expiresAt!: string;
}
