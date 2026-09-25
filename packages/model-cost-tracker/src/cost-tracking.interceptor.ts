import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError } from 'rxjs';
import {
  TRACK_COST_OPTIONS,
  type TrackCostOptions,
  extractAICostData,
} from './track-cost.decorator';
import { calculateCost, formatCost, formatTokens, type CostBreakdown } from './cost-calculator';
import { CostTrackerClient } from './cost-tracker.client';

/**
 * NestJS interceptor that automatically tracks model costs.
 *
 * Install in any NestJS service:
 * ```typescript
 * @Module({
 *   providers: [
 *     { provide: APP_INTERCEPTOR, useClass: CostTrackingInterceptor },
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * Then decorate AI methods:
 * ```typescript
 * @TrackCost({ agentId: 'EA-01', domain: 'finance' })
 * async generateReport(data: ReportData) { ... }
 * ```
 */
@Injectable()
export class CostTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CostTrackingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly costClient: CostTrackerClient
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<TrackCostOptions | undefined>(
      TRACK_COST_OPTIONS,
      [context.getHandler(), context.getClass()]
    );

    // Skip if not decorated or explicitly skipped
    if (!options || options.skip) {
      return next.handle();
    }

    const startTime = Date.now();
    const className = context.getClass()?.name ?? 'Unknown';
    const methodName = context.getHandler()?.name ?? 'unknown';

    return next.handle().pipe(
      tap((response: unknown) => {
        const latencyMs = Date.now() - startTime;
        const costData = extractAICostData(response);

        if (costData) {
          const breakdown = calculateCost({
            model: costData.model,
            inputTokens: costData.inputTokens,
            outputTokens: costData.outputTokens,
            latencyMs: costData.latencyMs ?? latencyMs,
          });

          // Apply cost multiplier if specified
          if (options.costMultiplier && options.costMultiplier !== 1) {
            breakdown.totalCostUsd *= options.costMultiplier;
            breakdown.totalCostUsd = Math.round(breakdown.totalCostUsd * 100_000_000) / 100_000_000;
          }

          this.logCost(className, methodName, breakdown, options);

          // Fire-and-forget recording to analytics service
          this.recordCost(breakdown, options, latencyMs).catch((err) => {
            this.logger.error(`Failed to record cost: ${err}`);
          });
        }
      }),
      catchError((error: unknown) => {
        const latencyMs = Date.now() - startTime;

        // Record failed call
        this.recordCost(
          {
            model: 'unknown',
            provider: 'unknown',
            tier: options.modelTier ?? 'T2',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            inputCostUsd: 0,
            outputCostUsd: 0,
            totalCostUsd: 0,
            latencyMs,
            costPerToken: 0,
            knownModel: false,
          },
          options,
          latencyMs,
          error instanceof Error ? error.message : String(error)
        ).catch(() => {
          /* metrics logging should not block request */
        });

        throw error;
      })
    );
  }

  private logCost(
    className: string,
    methodName: string,
    breakdown: CostBreakdown,
    options: TrackCostOptions
  ): void {
    const prefix = options.agentId ? `[${options.agentId}]` : '';
    const domain = options.domain ? `(${options.domain})` : '';

    this.logger.log(
      `${prefix} ${className}.${methodName} ${domain} ` +
        `model=${breakdown.model} ` +
        `tokens=${formatTokens(breakdown.inputTokens)}→${formatTokens(breakdown.outputTokens)} ` +
        `cost=${formatCost(breakdown.totalCostUsd)} ` +
        `latency=${breakdown.latencyMs ?? 'N/A'}ms` +
        `${!breakdown.knownModel ? ' ⚠️ UNKNOWN MODEL' : ''}`
    );
  }

  private async recordCost(
    breakdown: CostBreakdown,
    options: TrackCostOptions,
    latencyMs: number,
    errorMessage?: string
  ): Promise<void> {
    await this.costClient.recordEvent({
      agentId: options.agentId,
      model: breakdown.model,
      modelTier: breakdown.tier,
      taskType: options.taskType,
      inputTokens: breakdown.inputTokens,
      outputTokens: breakdown.outputTokens,
      costUsd: breakdown.totalCostUsd,
      latencyMs,
      domain: options.domain,
      success: !errorMessage,
      errorMessage,
    });
  }
}
