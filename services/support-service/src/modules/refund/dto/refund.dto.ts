import { IsString, IsOptional, IsDecimal, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestRefundDto {
  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiProperty()
  @IsDecimal()
  amount: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsString()
  ticketId: string;
}

export class ProcessRefundDto {
  @ApiProperty()
  @IsString()
  refundReference: string;
}

export class RejectRefundDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class RefundQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
