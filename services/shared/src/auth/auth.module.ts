import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SharedJwtStrategy } from './jwt.strategy';
import { MfaGuard } from './mfa.guard';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
          audience: configService.get<string>('JWT_AUDIENCE', 'azeebo-api'),
          issuer: configService.get<string>('JWT_ISSUER', 'azeebo-auth-service'),
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  providers: [SharedJwtStrategy, MfaGuard],
  exports: [PassportModule, JwtModule, SharedJwtStrategy, MfaGuard],
})
export class SharedAuthModule {}
