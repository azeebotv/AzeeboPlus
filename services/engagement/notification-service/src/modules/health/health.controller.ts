import { Inject, Controller, Get, HttpCode, HttpStatus, HttpException  } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<{ status: string; timestamp: string; database: string }> {
    let database = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new HttpException(
        { status: 'error', database: 'disconnected' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
    return {
      status: 'ok',
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
