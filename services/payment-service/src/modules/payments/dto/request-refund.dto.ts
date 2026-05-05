import { IsString, IsNotEmpty, MinLength, IsUUID, IsOptional } from 'class-validator';

export class RequestRefundDto {
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason!: string;

  @IsUUID('4')
  @IsOptional()
  idempotencyKey?: string;
}
