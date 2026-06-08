import { Module } from '@nestjs/common';
import { PaystackProvider } from './paystack.provider';
import { FlutterwaveProvider } from './flutterwave.provider';

@Module({
  providers: [PaystackProvider, FlutterwaveProvider],
  exports: [PaystackProvider, FlutterwaveProvider],
})
export class PaymentProviderModule {}
