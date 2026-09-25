import { Inject, Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';

@Public()
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch {
      throw new HttpException(
        { status: 'error', db: 'disconnected' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
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
  async readiness(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch {
      throw new HttpException(
        { status: 'error', db: 'disconnected' },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
