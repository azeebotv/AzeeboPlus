import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'Challenge ID to start' })
  @IsString()
  challengeId!: string;
}
