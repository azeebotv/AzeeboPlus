import { IsString, IsArray, IsNumber, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBundleDto {
  @ApiProperty({ example: 'Entertainment Bundle' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Reality, Comedy & Movies — all in one bundle' })
  @IsString()
  description!: string;

  @ApiProperty({ example: ['reality', 'comedy', 'movie'] })
  @IsArray()
  @IsString({ each: true })
  universeIds!: string[];

  @ApiProperty({ example: 2100 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 3000 })
  @IsNumber()
  @Min(0)
  originalPrice!: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  discountPercent!: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'standard', enum: ['standard', 'premium', 'ultimate'] })
  @IsString()
  @IsIn(['standard', 'premium', 'ultimate'])
  tier!: string;
}
