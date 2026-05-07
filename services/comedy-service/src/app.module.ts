import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { ComedyModule } from './modules/comedy/comedy.module';
import { ComedyFeedModule } from './modules/comedy-feed/comedy-feed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ComedyModule,
    ComedyFeedModule,
  ],
})
export class AppModule {}
