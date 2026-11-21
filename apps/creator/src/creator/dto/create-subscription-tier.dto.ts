import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionTierDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number = 0;
}
