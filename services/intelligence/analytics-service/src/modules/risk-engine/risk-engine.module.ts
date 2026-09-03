import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RiskEngineService } from './risk-engine.service';
import { RiskEngineController } from './risk-engine.controller';

@Module({
  imports: [DatabaseModule],
  providers: [RiskEngineService],
  controllers: [RiskEngineController],
  exports: [RiskEngineService],
})
export class RiskEngineModule {}
