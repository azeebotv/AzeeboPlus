import { Module } from '@nestjs/common';
import { PaystackProvider } from './paystack.provider.js';
import { FlutterwaveProvider } from './flutterwave.provider.js';

@Module({
  providers: [PaystackProvider, FlutterwaveProvider],
  exports: [PaystackProvider, FlutterwaveProvider],
})
export class PaymentProviderModule {}
