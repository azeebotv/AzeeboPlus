import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SuperVoteDto {
  @ApiProperty({ description: 'Contestant ID' })
  @IsString()
  contestantId!: string;

  @ApiProperty({ description: 'Episode ID' })
  @IsString()
  episodeId!: string;

  @ApiProperty({ description: 'Number of votes to cast' })
  @Type(() => Number)
  @IsInt()
  voteCount!: number;
}
