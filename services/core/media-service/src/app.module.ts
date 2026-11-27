import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './modules/upload/upload.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { FeatureFlagModule, mediaFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';
import { EventBusModule } from '@azeebo/event-bus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    EventBusModule.forRoot(
      {
        redisUrl: process.env.EVENT_BUS_REDIS_URL || 'redis://localhost:6379',
      },
      'media-service'
    ),
    UploadModule,
    AdminModule,
    HealthModule,
    // Media toggles: presigned URLs default ON; AV1 transcoding and virus
    // scanning default OFF until the pipelines are ready.
    FlagMetricsModule.register({ service: 'media-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('media-service'),
      defaultFlags: {
        [mediaFlags.uploadChunked]: false,
        [mediaFlags.presignedUrls]: true,
        [mediaFlags.transcodeAv1]: false,
        [mediaFlags.virusScan]: true,
        [mediaFlags.cdnEdgeCache]: true,
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
