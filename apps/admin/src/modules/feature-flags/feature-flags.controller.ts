import { Controller, Get, Put, Post, Delete, Param, Body, Query, Req, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureFlagsService } from './feature-flags.service';
import { StaleFlagSweepService } from './stale-flag-sweep.service';
import { StaleFlagNightlyService } from './stale-flag-nightly.service';
import { StaleFlagMetricsService } from './stale-metrics.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { PruneStaleFlagsDto } from './dto/prune-stale-flags.dto';
import { RestoreFlagsDto } from './dto/restore-flags.dto';
import { allFlagRegistries } from '@azeebo/feature-flags';

interface AdminRequest extends Request {
  user?: { id?: string; sub?: string };
}

@ApiTags('Admin - Global Feature Flags')
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class FeatureFlagsController {
  constructor(
    @Inject(FeatureFlagsService) private readonly featureFlagsService: FeatureFlagsService,
    @Inject(StaleFlagSweepService) private readonly staleSweepService: StaleFlagSweepService,
    @Inject(StaleFlagNightlyService) private readonly staleNightlyService: StaleFlagNightlyService,
    @Inject(StaleFlagMetricsService) private readonly staleMetricsService: StaleFlagMetricsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all global feature flags (stored + defaults)' })
  @ApiResponse({ status: 200, description: 'Global feature flags' })
  async getAll() {
    return this.featureFlagsService.getAll();
  }

  @Get('stale')
  @ApiOperation({ summary: 'List flags past their staleAfter date (removal candidates)' })
  @ApiResponse({ status: 200, description: 'Stale feature flags' })
  async getStale() {
    return this.featureFlagsService.getStaleFlags();
  }

  @Get('stale/metrics')
  @ApiOperation({
    summary: 'Per-key flag_stale_running_total from Prometheus — which stale flags are ACTIVELY served past expiry',
  })
  @ApiResponse({ status: 200, description: 'Stale-serving metrics (available, fetchedAt, staleRunning per key)' })
  async getStaleMetrics() {
    return this.staleMetricsService.getStaleRunningByKey();
  }

  @Post('prune-stale')
  @ApiOperation({
    summary: 'Batch-remove flags past their staleAfter, archiving each before deletion',
  })
  @ApiResponse({ status: 200, description: 'Prune summary (removedCount, removedKeys, archivedCount, skipped)' })
  async pruneStale(@Body() dto: PruneStaleFlagsDto, @Req() req: AdminRequest) {
    return this.featureFlagsService.pruneStaleFlags(
      req.user?.id ?? req.user?.sub,
      dto.keys
    );
  }

  @Post('stale-sweep/run')
  @ApiOperation({
    summary: 'Run the stale-flag sweep now (notify owners of flags past their staleAfter)',
  })
  @ApiResponse({ status: 200, description: 'Sweep summary (notified, alreadyNotified, failed)' })
  async runStaleSweep() {
    return this.staleSweepService.runSweep();
  }

  @Post('nightly/run')
  @ApiOperation({
    summary:
      'Run the nightly stale-flag pass now (owner sweep → optional auto-prune → ops-channel summary). ' +
      'Pass ?dryRun=1 to preview the universe prune without removing anything (reports exactly what ' +
      'STALE_FLAG_AUTO_PRUNE_UNIVERSE=true would remove)',
  })
  @ApiResponse({ status: 200, description: 'Nightly summary (stale, sweep, prune, universePrune, dryRunUniverse, webhook)' })
  async runNightly(@Query('dryRun') dryRun?: string) {
    const dryRunUniverse = dryRun === '1' || dryRun === 'true';
    return this.staleNightlyService.runNightly({ dryRunUniverse });
  }

  @Get('nightly/last')
  @ApiOperation({
    summary:
      'Most recent nightly stale-flag pass recorded in the audit log — times, counts, and webhook status',
  })
  @ApiResponse({ status: 200, description: 'Last nightly run summary, or null before the first pass' })
  async getLastNightlyRun() {
    return this.staleNightlyService.getLastRun();
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Recently deleted flags (restorable from archived audit snapshots)' })
  @ApiResponse({ status: 200, description: 'Deleted flags with archive availability' })
  async getRecentlyDeleted(@Query('limit') limit?: string) {
    const n = limit ? Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100) : 20;
    return this.featureFlagsService.getRecentlyDeleted(n);
  }

  @Post('restore')
  @ApiOperation({
    summary: 'Restore deleted flags from their archived audit snapshots (undo)',
  })
  @ApiResponse({ status: 200, description: 'Restore summary (restoredCount, restored, skipped)' })
  async restore(@Body() dto: RestoreFlagsDto, @Req() req: AdminRequest) {
    return this.featureFlagsService.restoreMany(dto.keys, req.user?.id ?? req.user?.sub);
  }

  @Get('known')
  @ApiOperation({ summary: 'Typed known-flags reference generated from the registries' })
  @ApiResponse({ status: 200, description: 'Known flag keys grouped by domain' })
  async getKnown() {
    // The registries live in @azeebo/feature-flags (compile-time checked keys);
    // this endpoint lets the admin UI render the canonical reference so ops
    // can discover every flag a service understands without reading source.
    const domains = Object.entries(allFlagRegistries).map(([domain, registry]) => ({
      domain,
      flags: Object.entries(registry).map(([property, key]) => ({ property, key })),
    }));
    return { success: true, data: { domains, total: domains.reduce((n, d) => n + d.flags.length, 0) } };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Create or update a global feature flag' })
  @ApiResponse({ status: 200, description: 'Flag updated' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Req() req: AdminRequest
  ) {
    return this.featureFlagsService.update(key, dto, req.user?.id ?? req.user?.sub);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a global feature flag (falls back to its default)' })
  @ApiResponse({ status: 200, description: 'Flag deleted' })
  async remove(@Param('key') key: string, @Req() req: AdminRequest) {
    return this.featureFlagsService.remove(key, req.user?.id ?? req.user?.sub);
  }
}
