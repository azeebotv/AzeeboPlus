import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimelineEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  importance?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  universeId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  characterId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationId?: string;
}
