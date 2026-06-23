import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CircuitBreakerHealthController } from './circuit-breaker.controller';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, CircuitBreakerHealthController],
  providers: [CircuitBreakerProxyService],
})
export class HealthModule {}