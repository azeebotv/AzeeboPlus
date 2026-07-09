import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Summer Music Festival 2026' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'A weekend of live music and performances' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-08-15T18:00:00Z' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-16T23:00:00Z' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Eko Convention Centre' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsString()
  @IsOptional()
  onlineLink?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAttendees?: number;

  @ApiPropertyOptional({ example: 'category-uuid-here' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'published', enum: ['draft', 'published', 'cancelled'] })
  @IsString()
  @IsOptional()
  status?: string;
}
