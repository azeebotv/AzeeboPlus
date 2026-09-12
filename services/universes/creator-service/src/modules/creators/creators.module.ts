import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimiterModule } from '@azeebo/security';
import { CacheModule, JwtConfigModule, JwtStrategy } from '@azeebo/shared-services';

import { CreatorsController } from './creators.controller.js';
import { CreatorsService } from './creators.service.js';
import { TippingController } from './tipping.controller.js';
import { TippingService } from './tipping.service.js';
import { WalletSnapshotSyncService } from './wallet-snapshot-sync.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { CreatorPayoutService } from '../creator/creator-payout.service.js';
import { CreatorTrustSafetyService } from '../creator/creator-trust-safety.service.js';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    RateLimiterModule,
    CacheModule,
    JwtConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CreatorsController, TippingController],
  providers: [
    CreatorsService,
    JwtStrategy,
    CreatorPayoutService,
    CreatorTrustSafetyService,
    TippingService,
    WalletSnapshotSyncService,
  ],
  exports: [
    CreatorsService,
    CreatorPayoutService,
    CreatorTrustSafetyService,
    TippingService,
    WalletSnapshotSyncService,
    DatabaseModule,
  ],
})
export class CreatorsModule {}
