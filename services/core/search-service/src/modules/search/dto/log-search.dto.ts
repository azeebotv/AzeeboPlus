import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LogSearchDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  query!: string;

  @ApiProperty({ description: 'Number of results returned', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  resultsCount?: number;
}
