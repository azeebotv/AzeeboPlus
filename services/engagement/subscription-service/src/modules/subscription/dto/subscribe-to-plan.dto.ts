import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeToPlanDto {
  @ApiProperty({ example: 'plan-uuid-here' })
  @IsString()
  planId!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 'wallet', enum: ['external', 'wallet'] })
  @IsString()
  @IsIn(['external', 'wallet'])
  @IsOptional()
  paymentMethod?: 'external' | 'wallet';

  @ApiPropertyOptional({
    example: 'pay_ref_abc123',
    description: 'Payment gateway reference (required when paymentMethod is external)',
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;
}
