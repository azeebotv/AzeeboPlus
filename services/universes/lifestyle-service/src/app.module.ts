import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { CommonModule } from './common/common.module';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    RateLimiterModule.forRoot(),
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
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}

