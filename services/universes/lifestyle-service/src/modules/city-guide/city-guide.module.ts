import { Module } from '@nestjs/common';
import { CityGuideController } from './city-guide.controller';
import { CityGuideService } from './city-guide.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CityGuideController],
  providers: [CityGuideService],
  exports: [CityGuideService],
})
export class CityGuideModule {}
