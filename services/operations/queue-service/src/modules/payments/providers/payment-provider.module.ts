import { Module, Global } from '@nestjs/common';
import { PaystackProvider } from './paystack.provider';
import { FlutterwaveProvider } from './flutterwave.provider';

// ARCHITECTURAL DEBT (Issue 10.1): Payment providers belong in payment-service,
// not queue-service. queue-service should dispatch payment jobs to payment-service
// via its API rather than owning provider integrations directly.

@Global()
@Module({
  providers: [PaystackProvider, FlutterwaveProvider],
  exports: [PaystackProvider, FlutterwaveProvider],
})
export class PaymentProviderModule {}
