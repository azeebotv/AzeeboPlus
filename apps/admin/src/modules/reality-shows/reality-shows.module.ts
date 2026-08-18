import { Module } from '@nestjs/common';
import { RealityShowsController } from './reality-shows.controller';
import { RealityShowsService } from './reality-shows.service';

@Module({
  controllers: [RealityShowsController],
  providers: [RealityShowsService],
  exports: [RealityShowsService],
})
export class RealityShowsModule {}
