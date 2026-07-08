import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RsvpDto {
  @ApiPropertyOptional({ example: 'going', enum: ['going', 'maybe', 'not_going'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  guests?: number;

  @ApiPropertyOptional({ example: 'Looking forward to it!' })
  @IsString()
  @IsOptional()
  note?: string;
}
