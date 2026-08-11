import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
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

  @ApiProperty({
    description: "The 'did you mean' suggestion shown for this query",
    required: false,
  })
  @IsString()
  @IsOptional()
  correction?: string;

  @ApiProperty({
    description: 'Whether the user accepted the suggested correction',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  accepted?: boolean;
}
