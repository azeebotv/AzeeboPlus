import { Controller, Get, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
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
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
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
