import { Module, Global } from '@nestjs/common';
import { ContentClientService } from './clients/content-client.service';
import { WalletClientService } from './clients/wallet-client.service';
import { AnalyticsClientService } from './clients/analytics-client.service';

@Global()
@Module({
  providers: [ContentClientService, WalletClientService, AnalyticsClientService],
  exports: [ContentClientService, WalletClientService, AnalyticsClientService],
})
export class ApiModule {}
