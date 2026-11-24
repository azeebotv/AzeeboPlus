import { Module } from '@nestjs/common';
import { CircuitBreakerProxyService } from './circuit-breaker-proxy.service';
import { CsrfTokenRegistry } from './csrf-token-registry.service';

@Module({
  providers: [CircuitBreakerProxyService, CsrfTokenRegistry],
  exports: [CircuitBreakerProxyService, CsrfTokenRegistry],
})
export class CommonModule {}
