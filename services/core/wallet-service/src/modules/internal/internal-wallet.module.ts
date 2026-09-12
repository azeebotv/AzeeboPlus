import { Module } from '@nestjs/common';
import { InternalWalletController } from './internal-wallet.controller.js';
import { WalletModule } from '../wallet/wallet.module.js';

/**
 * Secret-protected service-to-service wallet surface. WalletModule exports
 * WalletService and DatabaseModule, so no extra providers are needed here.
 */
@Module({
  imports: [WalletModule],
  controllers: [InternalWalletController],
})
export class InternalWalletModule {}
