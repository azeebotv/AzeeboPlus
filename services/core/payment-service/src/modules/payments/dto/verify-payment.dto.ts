import { IsString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Verify a payment by either identifier a caller holds.
 *
 * `transactionId` is the payment-intent id returned by `/initialize`.
 * `reference` is the provider reference the checkout sends back in its return
 * URL — and what the shipped clients post (`paymentApi.verify(reference)`).
 * Requiring only the former rejected every app-side verification with a 400
 * naming a field the caller never had. Exactly one of the two must be present.
 */
export class VerifyPaymentDto {
  @ApiPropertyOptional({ description: 'Payment intent id (from /initialize)' })
  @ValidateIf((dto: VerifyPaymentDto) => !dto.reference)
  @IsString()
  @IsNotEmpty()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Provider reference returned by checkout' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reference?: string;
}
