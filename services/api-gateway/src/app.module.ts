import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { HealthModule } from './modules/health/health.module';
import { ProxyModule } from './modules/proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `${__dirname}/../../.env`,
        `${__dirname}/../../../.env`,
        `${process.cwd()}/.env`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
      cache: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
      storage: new ThrottlerStorageRedisService(process.env.REDIS_URL || 'redis://localhost:6379'),
    }),
    HealthModule,
    ProxyModule,
  ],
})
export class AppModule {}
