import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoteDto {
  @ApiProperty({ description: 'Contestant ID', required: false })
  @IsString()
  @IsOptional()
  contestantId?: string;

  @ApiProperty({ description: 'Episode ID', required: false })
  @IsString()
  @IsOptional()
  episodeId?: string;

  @ApiProperty({ description: 'Whether this is a super vote' })
  @IsBoolean()
  isSuperVote!: boolean;
}
