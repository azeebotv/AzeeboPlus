import { Module, Global } from '@nestjs/common';
import { PaystackProvider } from './paystack.provider';
import { FlutterwaveProvider } from './flutterwave.provider';

@Global()
@Module({
  providers: [PaystackProvider, FlutterwaveProvider],
  exports: [PaystackProvider, FlutterwaveProvider],
})
export class PaymentProviderModule {}
