import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Premium Monthly' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Full access to all premium content' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'NGN', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiProperty({ example: ['HD streaming', 'No ads', 'Offline downloads'] })
  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @ApiProperty({ example: 'premium' })
  @IsString()
  tier!: string;
}
