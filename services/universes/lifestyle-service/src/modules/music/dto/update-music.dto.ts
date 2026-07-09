import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMusicDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

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
  artistName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  albumName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  trackUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
