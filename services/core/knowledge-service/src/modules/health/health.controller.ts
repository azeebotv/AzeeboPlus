import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@azeebo/security';

@ApiTags('Health')
// Unauthenticated by design: container/compose healthchecks and the gateway
// liveness probe hit this route without credentials.
@Public()
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
