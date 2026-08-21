import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCanonicalEventDto {
  @ApiProperty({ description: 'Machine-readable event code, e.g. S01E01_AIR' })
  @IsString()
  @IsNotEmpty()
  eventCode!: string;

  @ApiProperty({ description: 'Human-readable title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Universe ID from content-service' })
  @IsString()
  @IsNotEmpty()
  universeId!: string;

  @ApiProperty({ description: 'Date the event occurred (ISO 8601)' })
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ description: 'Bounded extensible metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
