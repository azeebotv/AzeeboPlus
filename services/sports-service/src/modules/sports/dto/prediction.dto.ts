import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePredictionDto {
  @ApiProperty()
  @IsString()
  eventId!: string;

  @ApiProperty()
  prediction!: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  stake?: number;
}

export class EnterContestDto {
  @ApiProperty()
  @IsString()
  contestId!: string;
}
