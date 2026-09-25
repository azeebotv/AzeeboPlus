import { IsString, IsOptional, IsInt, Min, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSuspensionDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  ticketId: string = '';

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  userId: string = '';

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  reason: string = '';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays?: number;
}

export class SuspensionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
