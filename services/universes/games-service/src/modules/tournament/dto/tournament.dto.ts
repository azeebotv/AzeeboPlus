import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinTournamentDto {
  /**
   * Optional: joining starts at zero (`enterTournament` defaults the argument
   * to 0). Without `@IsOptional()` the pipe required it, so a plain
   * "join this tournament" POST was rejected before the default applied.
   */
  @ApiPropertyOptional()
  @IsOptional()
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
