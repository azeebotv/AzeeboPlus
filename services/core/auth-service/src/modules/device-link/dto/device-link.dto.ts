import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class InitiateDeviceLinkDto {
  @ApiPropertyOptional({ description: 'Human-readable TV name', example: 'Living Room TV' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceName?: string;

  @ApiPropertyOptional({ description: 'Device category', example: 'tv', default: 'tv' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  deviceType?: string;
}

export class PollDeviceLinkDto {
  @ApiProperty({ description: 'Secret device credential returned by /auth/device/link' })
  @IsString()
  @MinLength(1)
  deviceCode!: string;
}

export class ConfirmDeviceLinkDto {
  @ApiProperty({ description: 'The code shown on the TV screen', example: '7K2M-9QX4' })
  @IsString()
  @MinLength(1)
  code!: string;
}

export class DenyDeviceLinkDto {
  @ApiProperty({ description: 'The code shown on the TV screen', example: '7K2M-9QX4' })
  @IsString()
  @MinLength(1)
  code!: string;
}

export class DescribeDeviceLinkDto {
  @ApiProperty({ description: 'The code shown on the TV screen', example: '7K2M-9QX4' })
  @IsString()
  @MinLength(1)
  code!: string;
}
