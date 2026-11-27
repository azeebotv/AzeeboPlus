import { IsNumber, IsOptional, IsString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestPayoutDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['bank_transfer', 'paypal', 'crypto', 'stripe'])
  method?: string = 'bank_transfer';
}
