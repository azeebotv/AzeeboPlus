import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
