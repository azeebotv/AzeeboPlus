import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigModule } from '@azeebo/shared-services';

import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { WalletRepository } from './wallet.repository.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    JwtConfigModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletService, WalletRepository, DatabaseModule],
})
export class WalletModule {}
