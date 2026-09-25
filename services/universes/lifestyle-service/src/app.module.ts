import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { StoriesModule } from './modules/stories/stories.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { SocialModule } from './modules/social/social.module';
import { CityGuideModule } from './modules/city-guide/city-guide.module';
import { MusicModule } from './modules/music/music.module';
import { CelebrityModule } from './modules/celebrity/celebrity.module';
import { NightlifeModule } from './modules/nightlife/nightlife.module';
import { InfluencerModule } from './modules/influencer/influencer.module';
import { FeedModule } from './modules/feed/feed.module';
import { ChallengeModule } from './modules/challenges/challenge.module';
import { PollModule } from './modules/polls/poll.module';
import { QuizModule } from './modules/quizzes/quiz.module';
import { AdminModule } from './modules/admin/admin.module';
import { GuidesModule } from './modules/guides/guides.module';
import { ParticipationModule } from './modules/participation/participation.module';
import { CommonModule } from './common/common.module';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, lifestyleFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    CommonModule,
    RateLimiterModule.forRoot(),
    CacheModule,
    DatabaseModule,
    HealthModule,
    StoriesModule,
    EventsModule,
    SocialModule,
    CityGuideModule,
    MusicModule,
    CelebrityModule,
    NightlifeModule,
    InfluencerModule,
    FeedModule,
    ChallengeModule,
    PollModule,
    QuizModule,
    GuidesModule,
    ParticipationModule,
    AdminModule,
    // Lifestyle feature gates: shipped surfaces ON, incubating modules OFF.
    FlagMetricsModule.register({ service: 'lifestyle-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('lifestyle-service'),
      defaultFlags: {
        [lifestyleFlags.eventsTicketing]: false,
        [lifestyleFlags.storiesEnabled]: true,
        [lifestyleFlags.cityGuide]: false,
        [lifestyleFlags.influencerVerification]: false,
        [lifestyleFlags.nightlifeBooking]: false,
        [lifestyleFlags.pollsEnabled]: true,
        [lifestyleFlags.quizzesEnabled]: true,
        [lifestyleFlags.celebrityFeed]: true,
        [lifestyleFlags.musicEnabled]: true,
        [lifestyleFlags.socialEnabled]: true,
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
