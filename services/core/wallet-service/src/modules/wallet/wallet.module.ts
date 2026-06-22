import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletService, WalletRepository, DatabaseModule],
})
export class WalletModule {}
