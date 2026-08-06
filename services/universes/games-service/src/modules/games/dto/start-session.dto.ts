import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'Challenge ID to start' })
  @IsString()
  @Length(1, 100)
  challengeId!: string;
}
