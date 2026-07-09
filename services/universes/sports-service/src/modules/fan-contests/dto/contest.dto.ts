import { IsObject, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinContestDto {
  @ApiProperty()
  @IsObject()
  entryData!: Record<string, unknown>;
}

export class SubmitContestScoreDto {
  @ApiProperty()
  @IsNumber()
  score!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeTaken?: number;
}
