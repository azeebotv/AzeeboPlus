import { Module } from '@nestjs/common';
import { CityGuideController } from './city-guide.controller';
import { CityGuideService } from './city-guide.service';

@Module({
  controllers: [CityGuideController],
  providers: [CityGuideService],
  exports: [CityGuideService],
})
export class CityGuideModule {}
