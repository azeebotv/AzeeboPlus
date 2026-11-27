import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeBundleDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 'wallet', enum: ['external', 'wallet'] })
  @IsString()
  @IsIn(['external', 'wallet'])
  @IsOptional()
  paymentMethod?: 'external' | 'wallet';

  @ApiPropertyOptional({ example: 'pay_ref_abc123' })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Apply prorated credit from active single-universe passes',
  })
  @IsBoolean()
  @IsOptional()
  applyProration?: boolean;
}
