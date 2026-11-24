import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleUniverseDto {
  @ApiProperty({ description: 'Enable or disable the universe', default: true })
  @IsBoolean()
  isEnabled!: boolean;
}
