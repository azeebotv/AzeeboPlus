import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CastVoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contestantId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  showId!: string;
}

export class BuyVoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contestantId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  showId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class MakePredictionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  showId!: string;

  @ApiProperty()
  prediction!: Record<string, unknown>;
}
