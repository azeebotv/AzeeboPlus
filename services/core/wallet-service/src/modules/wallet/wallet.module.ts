import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule, RedisModule } from '@azeebo/shared-services';

import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { WalletRepository } from './wallet.repository.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  // RedisModule is required so WalletService can inject RedisService (it is
  // NOT global — CacheModule only re-exports CacheService/CacheInterceptor).
  imports: [ConfigModule, DatabaseModule, JwtConfigModule, RedisModule],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletService, WalletRepository, DatabaseModule],
})
export class WalletModule {}
