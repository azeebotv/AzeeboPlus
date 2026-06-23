import { Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { CircuitBreakerProxyService } from '../../common/circuit-breaker-proxy.service';

@Public()
@Controller('health')
export class CircuitBreakerHealthController {
  constructor(private readonly proxyService: CircuitBreakerProxyService) {}

  @Get('circuit-breaker')
  getCircuitBreakerStatus() {
    return {
      success: true,
      data: {
        circuits: this.proxyService.getAllCircuitStats(),
      },
    };
  }

  @Get('circuit-breaker/:service')
  getCircuitBreakerServiceStatus(@Param('service') service: string) {
    const stats = this.proxyService.getCircuitStats(service);
    if (!stats) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No circuit breaker found for service: ${service}`,
        },
      };
    }
    return {
      success: true,
      data: {
        service,
        ...stats,
      },
    };
  }

  @Post('circuit-breaker/:service/reset')
  resetCircuitBreaker(@Param('service') service: string) {
    const reset = this.proxyService.resetCircuitBreaker(service);
    if (!reset) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `No circuit breaker found for service: ${service}`,
        },
      };
    }
    return {
      success: true,
      data: {
        service,
        message: 'Circuit breaker reset successfully',
      },
    };
  }
}