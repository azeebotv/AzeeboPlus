import { IsString, IsNumber, IsIn, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePayoutSettingsDto {
  @IsString()
  @IsIn(['bank_transfer', 'paypal', 'crypto', 'stripe'])
  method!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimum!: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;
}
