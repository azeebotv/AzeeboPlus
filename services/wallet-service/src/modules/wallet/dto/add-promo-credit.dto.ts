import { IsNumber, IsPositive, IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddPromoCreditDto {
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  amount!: number;

  @IsString()
  @IsNotEmpty()
  promoCode!: string;

  @IsDateString()
  expiresAt!: string;
}
