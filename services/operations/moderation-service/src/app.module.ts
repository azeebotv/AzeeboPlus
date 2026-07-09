import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ModerationModule } from './modules/moderation/moderation.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ServiceAuthGuard } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    CacheModule,
    DatabaseModule,
    ModerationModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
