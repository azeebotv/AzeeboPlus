import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { SportsModule } from './modules/sports/sports.module';
import { PredictionMarketsModule } from './modules/prediction-markets/prediction-markets.module';
import { FixturesModule } from './modules/fixtures/fixtures.module';
import { FanContestsModule } from './modules/fan-contests/fan-contests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    SportsModule,
    PredictionMarketsModule,
    FixturesModule,
    FanContestsModule,
  ],
})
export class AppModule {}
