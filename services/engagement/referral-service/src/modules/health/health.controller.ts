import { Controller, Get } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'referral-service',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async checkReady() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async checkLive() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
