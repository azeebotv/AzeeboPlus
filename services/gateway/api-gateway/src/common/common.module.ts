import { Module } from '@nestjs/common';
import { CircuitBreakerProxyService } from './circuit-breaker-proxy.service';

@Module({
  providers: [CircuitBreakerProxyService],
  exports: [CircuitBreakerProxyService],
})
export class CommonModule {}
