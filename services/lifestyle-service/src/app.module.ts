import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
})
export class AppModule {}
