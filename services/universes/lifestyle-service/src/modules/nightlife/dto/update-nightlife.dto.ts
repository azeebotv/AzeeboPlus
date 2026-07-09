import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNightlifeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hours?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dressCode?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  coverCharge?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
