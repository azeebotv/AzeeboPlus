import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModerationModule } from './modules/moderation/moderation.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ModerationModule,
    HealthModule,
  ],
})
export class AppModule {}
