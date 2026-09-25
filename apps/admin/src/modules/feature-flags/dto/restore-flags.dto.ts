import { IsArray, IsString, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestoreFlagsDto {
  @ApiProperty({
    description: 'Flag keys to restore from their archived audit snapshots',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  keys!: string[];
}
