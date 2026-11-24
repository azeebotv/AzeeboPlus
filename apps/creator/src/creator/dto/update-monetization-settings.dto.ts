import { IsBoolean, IsNumber, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMonetizationSettingsDto {
  @IsOptional()
  @IsBoolean()
  tippingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  subscriptionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  payPerViewEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minimumTip?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  customTipAmounts?: number[];
}
