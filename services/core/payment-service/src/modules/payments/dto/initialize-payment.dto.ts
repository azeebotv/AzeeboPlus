import { IsString, IsOptional, IsObject, IsEmail, Min, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  metadata?: Record<string, unknown>;

  @IsUUID('4')
  @IsOptional()
  idempotencyKey?: string;

  /**
   * Accepted, not used: the paying user comes from the verified JWT, and every
   * client in this repo (`paymentApi.initialize`, the wallet funding flow) sends
   * the account email alongside the amount. `whitelist` + `forbidNonWhitelisted`
   * turned that harmless extra field into a 400 on every checkout, so it is
   * declared here and ignored rather than rejected.
   */
  @ApiPropertyOptional({
    description: 'Payer email (accepted for compatibility; identity comes from the JWT)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * Accepted, not used: the active provider is a deployment setting
   * (`getActiveProvider`), but the controller's own request examples advertise
   * this field, so the documented payload must not 400.
   */
  @ApiPropertyOptional({
    description: 'Preferred provider (accepted for compatibility; the active provider decides)',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
