import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CastVoteDto {
  @ApiProperty()
  @IsString()
  contestantId!: string;

  @ApiProperty()
  @IsString()
  showId!: string;
}

export class BuyVoteDto {
  @ApiProperty()
  @IsString()
  contestantId!: string;

  @ApiProperty()
  @IsString()
  showId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class MakePredictionDto {
  @ApiProperty()
  @IsString()
  showId!: string;

  @ApiProperty()
  prediction!: Record<string, unknown>;
}
