import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PassportModule } from '@nestjs/passport';
import { HealthController } from './health.controller';
import { CircuitBreakerHealthController } from './circuit-breaker.controller';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service';

@Module({
  imports: [TerminusModule, PassportModule],
  controllers: [HealthController, CircuitBreakerHealthController],
  providers: [CircuitBreakerProxyService],
})
export class HealthModule {}
