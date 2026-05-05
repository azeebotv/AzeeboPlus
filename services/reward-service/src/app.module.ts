import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RewardsModule } from './modules/rewards/rewards.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RewardsModule,
    HealthModule,
  ],
})
export class AppModule {}
