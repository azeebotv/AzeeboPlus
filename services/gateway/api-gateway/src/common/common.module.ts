import { Module, Global } from '@nestjs/common';
import { CircuitBreakerProxyService } from './circuit-breaker-proxy.service';

@Global()
@Module({
  providers: [CircuitBreakerProxyService],
  exports: [CircuitBreakerProxyService],
})
export class CommonModule {}