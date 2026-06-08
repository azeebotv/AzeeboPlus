import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceInfoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
