import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from './modules/search/search.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { RateLimiterModule } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { ServiceAuthGuard } from '@azeebo/security';
import { FeatureFlagModule, searchFlags } from '@azeebo/feature-flags';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    DatabaseModule,
    SearchModule,
    AdminModule,
    HealthModule,
    // Search toggles: trending caching + query logging ON; faceted search,
    // typo tolerance, and AI suggestions OFF until rolled out.
    FeatureFlagModule.register({
      global: true,
      defaultFlags: {
        [searchFlags.faceted]: false,
        [searchFlags.typoTolerance]: false,
        [searchFlags.suggestionsAi]: false,
        [searchFlags.trendingCached]: true,
        [searchFlags.logQueries]: true,
      },
      defaultValues: {
        // Fuzzy blend: 0.4 trigram / 0.6 Levenshtein — runtime-tunable.
        [searchFlags.fuzzyTrigramWeight]: 0.4,
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
