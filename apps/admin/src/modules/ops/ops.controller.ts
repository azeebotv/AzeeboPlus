import {
  Inject,
  Controller,
  Get,
  Put,
  Body,
  Query,
  Post,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  OpsService,
  OpsStatus,
  OpsRunHistory,
  RunJobOutcome,
  ServiceHealthResult,
  CreatorTipSummary,
  GatewayHttpSummary,
  GatewayRateLimitSnapshot,
  PgbouncerHealth,
  TransportFlipTrend,
} from './ops.service';

@Controller('admin/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class OpsController {
  constructor(@Inject(OpsService) private readonly opsService: OpsService) {}

  @Get('status')
  getStatus(): Promise<OpsStatus> {
    return this.opsService.getStatus();
  }

  /** Pass-history ledger for the job cards' charts. Defaults to the last 24h. */
  @Get('runs')
  getRunHistory(@Query('hours') hours?: string): Promise<OpsRunHistory> {
    const parsed = Number(hours);
    return this.opsService.getRunHistory(Number.isFinite(parsed) && parsed > 0 ? parsed : 24);
  }

  /** Fleet health, probed server-side (never from the browser). */
  @Get('services')
  getServiceHealth(): Promise<{ services: ServiceHealthResult[]; checkedAt: string }> {
    return this.opsService.getServiceHealth();
  }

  /** pgbouncer pool saturation (SHOW POOLS vs max_client_conn). */
  @Get('pgbouncer')
  getPgbouncerHealth(): Promise<PgbouncerHealth> {
    return this.opsService.getPgbouncerHealth();
  }

  /** Transport-flip persistence trend (ledger-backed, default 14 days). */
  @Get('transport-flips')
  getTransportFlipTrend(@Query('days') days?: string): Promise<TransportFlipTrend> {
    const parsed = Number(days);
    return this.opsService.getTransportFlipTrend(
      Number.isFinite(parsed) && parsed > 0 ? parsed : 14
    );
  }

  /** Aggregated creator tipping overview (single call — no client fan-out). */
  @Get('tipping-summary')
  getTippingSummary(@Query('limit') limit?: string): Promise<CreatorTipSummary[]> {
    const parsed = Number(limit);
    return this.opsService.getTippingSummary(Number.isFinite(parsed) && parsed > 0 ? parsed : 50);
  }

  /** Platform commission and limit settings for creator tips */
  @Get('tipping-config')
  getTippingConfig() {
    return this.opsService.getTippingConfig();
  }

  @Put('tipping-config')
  updateTippingConfig(
    @Body() body: { platformCommissionPct?: number; maxTipAmount?: number; currency?: string }
  ) {
    return this.opsService.updateTippingConfig(body);
  }

  /** Gateway HTTP performance, scraped server-side from the gateway's Prometheus exposition. */
  @Get('gateway-http')
  getGatewayHttp(): Promise<GatewayHttpSummary> {
    return this.opsService.getGatewayHttp();
  }

  /** Gateway-enforced auth rate limits, scraped server-side from the same exposition. */
  @Get('gateway-rate-limits')
  getGatewayRateLimits(): Promise<GatewayRateLimitSnapshot> {
    return this.opsService.getGatewayRateLimits();
  }

  /** Manually run one scheduled job's script; returns the outcome tail. */
  @Post('run/:job')
  async runJob(@Param('job') job: string): Promise<RunJobOutcome> {
    try {
      return await this.opsService.runJob(job);
    } catch (e) {
      throw new HttpException(
        (e as Error).message || 'run failed to start',
        /already running/.test((e as Error).message) ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST
      );
    }
  }
}
