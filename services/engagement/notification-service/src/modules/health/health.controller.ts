import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '@azeebo/security';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
