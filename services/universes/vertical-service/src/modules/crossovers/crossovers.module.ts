import { Module } from '@nestjs/common';
import { CrossoversController } from './crossovers.controller';
import { CrossoversService } from './crossovers.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CrossoversController],
  providers: [CrossoversService],
  exports: [CrossoversService],
})
export class CrossoversModule {}
