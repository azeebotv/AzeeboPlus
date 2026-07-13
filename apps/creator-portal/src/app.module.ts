import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CreatorModule } from './creator/creator.module';
import { DatabaseModule } from './database/database.module';
import { ApiModule } from './api/api.module';
import { ServiceAuthGuard } from '@azeebo/security';
import { CsrfMiddleware } from './common/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ApiModule,
    CreatorModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: 'api/v1/auth/*path', method: RequestMethod.ALL },
        { path: 'api/auth/*path', method: RequestMethod.ALL },
        { path: 'api/health', method: RequestMethod.ALL },
        { path: '*path', method: RequestMethod.GET },
        { path: '*path', method: RequestMethod.HEAD },
        { path: '*path', method: RequestMethod.OPTIONS }
      )
      .forRoutes('api');
  }
}
