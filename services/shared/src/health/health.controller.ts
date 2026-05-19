import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.checkHealth();
  }

  @Get('ready')
  async getReady() {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  async getLive() {
    return this.healthService.checkLiveness();
  }
}
