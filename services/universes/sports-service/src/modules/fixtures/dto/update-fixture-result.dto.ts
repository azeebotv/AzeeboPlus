import { IsString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TeamScoreDto {
  @ApiProperty()
  @IsString()
  teamId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  score!: number;
}

export class UpdateFixtureResultDto {
  @ApiProperty({ type: [TeamScoreDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamScoreDto)
  teams!: TeamScoreDto[];
}
