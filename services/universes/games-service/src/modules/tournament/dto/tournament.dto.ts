import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinTournamentDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  initialScore?: number;
}

export class SubmitScoreDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  score!: number;
}
