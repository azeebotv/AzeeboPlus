import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from './modules/search/search.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { RateLimiterModule } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule,
    DatabaseModule,
    SearchModule,
    HealthModule,
  ],
})
export class AppModule {}
