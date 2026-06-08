import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ description: 'Unique key identifier for the setting' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'Setting value (can be any JSON-serializable value)' })
  @IsObject()
  value!: any;

  @ApiProperty({ description: 'Category for grouping settings', default: 'general' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Description of the setting', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Whether the setting is publicly accessible', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
