import { Module } from '@nestjs/common';
import { CrossoversController } from './crossovers.controller';
import { CrossoversService } from './crossovers.service';

@Module({
  controllers: [CrossoversController],
  providers: [CrossoversService],
  exports: [CrossoversService],
})
export class CrossoversModule {}
