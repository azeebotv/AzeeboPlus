import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeToPlanDto {
  @ApiProperty({ example: 'plan-uuid-here' })
  @IsString()
  planId!: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiProperty({ example: 'card', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: 'pay_ref_abc123', description: 'Payment gateway reference' })
  @IsString()
  paymentReference!: string;
}
