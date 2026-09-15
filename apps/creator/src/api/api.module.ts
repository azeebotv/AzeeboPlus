import { Module, Global } from '@nestjs/common';
import { ContentClientService } from './clients/content-client.service';
import { WalletClientService } from './clients/wallet-client.service';
import { AnalyticsClientService } from './clients/analytics-client.service';
import { CreatorsClientService } from './clients/creators-client.service';

@Global()
@Module({
  providers: [
    ContentClientService,
    WalletClientService,
    AnalyticsClientService,
    CreatorsClientService,
  ],
  exports: [
    ContentClientService,
    WalletClientService,
    AnalyticsClientService,
    CreatorsClientService,
  ],
})
export class ApiModule {}
