import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ModerateContentDto {
  @ApiProperty({ description: 'Moderation action to take' })
  @IsString()
  action!: string;

  @ApiProperty({ description: 'Reason for moderation' })
  @IsString()
  reason!: string;
}
