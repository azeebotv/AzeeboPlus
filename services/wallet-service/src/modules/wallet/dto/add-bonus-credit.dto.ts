import { IsNumber, IsPositive, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddBonusCreditDto {
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
