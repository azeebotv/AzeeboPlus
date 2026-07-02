import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<{ status: string; timestamp: string; database: string }> {
    let database = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'unavailable';
    }
    return {
      status: database === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database,
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
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
