import { IsString, IsNumber, Min, IsOptional, IsArray, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubscriptionTierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;
}
