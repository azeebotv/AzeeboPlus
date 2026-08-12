import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UniverseFlagKeyDto {
  @ApiProperty({ description: 'Universe ID' })
  @IsString()
  universeId!: string;

  @ApiProperty({ description: 'Feature flag key within the universe' })
  @IsString()
  featureKey!: string;
}

export class RestoreUniverseFlagsDto {
  @ApiProperty({
    description:
      'Universe flag keys to restore from their archived audit snapshots (the confirmed undo batch)',
    type: [UniverseFlagKeyDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniverseFlagKeyDto)
  keys!: Array<{ universeId: string; featureKey: string }>;
}
