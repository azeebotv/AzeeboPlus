import { IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class RedeemRewardDto {
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  points!: number;
}
