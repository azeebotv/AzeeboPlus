import { IsArray, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkToggleUniverseDto {
  @ApiProperty({ description: 'Array of universe IDs to toggle', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @ApiProperty({ description: 'Enable or disable the universes', default: true })
  @IsBoolean()
  isEnabled!: boolean;
}
