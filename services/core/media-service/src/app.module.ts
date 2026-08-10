import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './modules/upload/upload.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { ServiceAuthGuard, RateLimiterModule } from '@azeebo/security';
import { FeatureFlagModule, mediaFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    UploadModule,
    AdminModule,
    HealthModule,
    // Media toggles: presigned URLs default ON; AV1 transcoding and virus
    // scanning default OFF until the pipelines are ready.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [mediaFlags.uploadChunked]: false,
        [mediaFlags.presignedUrls]: true,
        [mediaFlags.transcodeAv1]: false,
        [mediaFlags.virusScan]: false,
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
