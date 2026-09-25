import { Controller, Get, HttpCode, HttpStatus, Version } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Version('')
  @Get()
  check(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Version('')
  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Version('')
  @Get('ready')
  readiness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
