import { Module } from '@nestjs/common';
import { PredictionMarketsController } from './prediction-markets.controller';
import { PredictionMarketsService } from './prediction-markets.service';

@Module({
  controllers: [PredictionMarketsController],
  providers: [PredictionMarketsService],
  exports: [PredictionMarketsService],
})
export class PredictionMarketsModule {}
