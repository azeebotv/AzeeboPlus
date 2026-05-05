import { IsNumber, IsString, IsOptional, IsObject, Min, IsUUID } from 'class-validator';

export class InitializePaymentDto {
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID('4')
  @IsOptional()
  idempotencyKey?: string;
}