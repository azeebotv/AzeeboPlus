import { IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReferralCodeDto {
  @ApiPropertyOptional({ description: 'Maximum number of uses for this code' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Expiration date for the code' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ApplyReferralCodeDto {
  @ApiProperty({ description: 'Referral code to apply' })
  @IsString()
  code!: string;
}
