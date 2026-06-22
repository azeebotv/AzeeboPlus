import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    description: 'Setting value (can be any JSON-serializable value)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  value?: any;

  @ApiProperty({ description: 'Category for grouping settings', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Description of the setting', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Whether the setting is publicly accessible', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
