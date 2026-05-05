import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreatorModule } from './creator/creator.module';
import { DatabaseModule } from './database/database.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ApiModule,
    CreatorModule,
  ],
})
export class AppModule {}
