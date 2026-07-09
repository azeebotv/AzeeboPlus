import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Summer Music Festival' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A weekend of live music and performances' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2026-08-15T18:00:00Z' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

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

  @ApiPropertyOptional({ default: false })
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
}
