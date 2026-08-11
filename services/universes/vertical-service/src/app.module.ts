import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './modules/database/database.module';
import { UniverseModule } from './modules/universe/universe.module';
import { CharactersModule } from './modules/characters/characters.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { HealthModule } from './modules/health/health.module';
import { TitlesModule } from './modules/titles/titles.module';
import { LoreModule } from './modules/lore/lore.module';
import { CrossoversModule } from './modules/crossovers/crossovers.module';
import { AdminModule } from './modules/admin/admin.module';
import { StoryworldsModule } from './modules/storyworlds/storyworlds.module';
import { RateLimiterModule, ServiceAuthGuard } from '@azeebo/security';
import { ConfigModule } from '@nestjs/config';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { CacheModule, JwtConfigModule } from '@azeebo/shared-services';
import { FeatureFlagModule, verticalFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    JwtConfigModule,
    DatabaseModule,
    CacheModule,
    HealthModule,
    UniverseModule,
    CharactersModule,
    TimelineModule,
    TitlesModule,
    LoreModule,
    CrossoversModule,
    StoryworldsModule,
    AdminModule,
    // Vertical feature gates: timeline ON; crossovers, AI lore + community
    // storyworld creation OFF until launched.
    FlagMetricsModule.register({ service: 'vertical-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('vertical-service'),
      defaultFlags: {
        [verticalFlags.crossoversEnabled]: false,
        [verticalFlags.timelineEnabled]: true,
        [verticalFlags.loreAi]: false,
        [verticalFlags.storyworldsCreate]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
  ],
})
export class AppModule {}
