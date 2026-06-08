import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupportController } from '../support/support.controller';
import { SupportService } from '../support/support.service';
import { SupportRepository } from '../support/support.repository';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository, PrismaService],
})
export class SupportModule {}
