import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './health.controller';
import { CircuitBreakerHealthController } from './circuit-breaker.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TerminusModule, JwtModule, CommonModule],
  controllers: [HealthController, CircuitBreakerHealthController],
})
export class HealthModule {}
